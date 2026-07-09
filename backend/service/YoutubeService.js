import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { BrowserWindow, ipcMain } from 'electron';
import { assertBinariesAvailable, getBinariesStatus, getYtDlpPath, getFfmpegPath } from '../youtube/binaries.js';
import { YoutubeError, YoutubeErrorCodes, youtubeFailure, youtubeSuccess } from '../youtube/errors.js';
import { extractYoutubeVideoId, normalizeYoutubeUrl } from '../youtube/extractVideoId.js';
import articleService from './ArticleService.js';
import videoService from './VideoService.js';

const activeDownloadJobs = new Map();

function sendDownloadProgress(jobId, percent) {
    const payload = { jobId, percent };
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send('youtube-download-progress', payload);
    }
}

function parseProgressPercent(text) {
    if (!text) return null;
    const downloadMatch = text.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
    if (downloadMatch) return parseFloat(downloadMatch[1]);

    const mergerMatch = text.match(/\[Merger\]/);
    if (mergerMatch) return null;

    const genericMatch = text.match(/(\d+(?:\.\d+)?)%/);
    return genericMatch ? parseFloat(genericMatch[1]) : null;
}

function handleProgressOutput(text, onProgress) {
    if (!onProgress || !text) return;

    const segments = text.split(/\r|\n/);
    for (const segment of segments) {
        const percent = parseProgressPercent(segment);
        if (percent != null) onProgress(percent);
    }
}

function runYtDlp(args, { onProgress, jobContext } = {}) {
    return new Promise((resolve, reject) => {
        const ytDlp = getYtDlpPath();
        const ffmpeg = getFfmpegPath();
        const fullArgs = [...args, '--ffmpeg-location', ffmpeg];
        const child = spawn(ytDlp, fullArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

        if (jobContext) jobContext.child = child;

        let stdout = '';
        let stderr = '';

        const onData = (chunk) => {
            const text = chunk.toString();
            handleProgressOutput(text, onProgress);
        };

        child.stdout.on('data', (chunk) => {
            const text = chunk.toString();
            stdout += text;
            onData(chunk);
        });

        child.stderr.on('data', (chunk) => {
            const text = chunk.toString();
            stderr += text;
            onData(chunk);
        });

        child.on('error', (err) => {
            if (err.code === 'ENOENT') {
                reject(new YoutubeError(
                    YoutubeErrorCodes.YT_DLP_MISSING,
                    'yt-dlp executable could not be started',
                    ytDlp,
                ));
                return;
            }
            reject(err);
        });

        child.on('close', (code) => {
            if (jobContext?.cancelled) {
                reject(new YoutubeError(YoutubeErrorCodes.DOWNLOAD_CANCELLED, 'Download cancelled'));
                return;
            }

            if (code === 0) resolve({ stdout, stderr });
            else reject(new YoutubeError(
                YoutubeErrorCodes.FETCH_FAILED,
                stderr.trim() || `yt-dlp exited with code ${code}`,
            ));
        });
    });
}

function formatBytes(bytes) {
    if (!bytes || Number.isNaN(bytes)) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function parseFormats(rawFormats = []) {
    const formats = rawFormats
        .filter((f) => f.format_id && f.format_id !== 'sb' && f.vcodec && f.vcodec !== 'none')
        .map((f) => {
            const hasAudio = f.acodec && f.acodec !== 'none';
            const filesize = f.filesize || f.filesize_approx || null;
            const height = f.height || 0;
            const labelParts = [];
            if (height) labelParts.push(`${height}p`);
            else if (f.format_note) labelParts.push(f.format_note);
            if (f.fps) labelParts.push(`${f.fps}fps`);
            labelParts.push((f.ext || 'unknown').toUpperCase());
            if (!hasAudio) labelParts.push('(video only)');
            const sizeLabel = formatBytes(filesize);
            if (sizeLabel) labelParts.push(sizeLabel);

            return {
                formatId: f.format_id,
                ext: f.ext || 'mp4',
                resolution: height ? `${height}p` : (f.format_note || 'unknown'),
                quality: height || 0,
                fps: f.fps || 0,
                filesize,
                hasAudio,
                hasVideo: true,
                label: labelParts.join(' · '),
            };
        });

    formats.sort((a, b) => {
        if (b.quality !== a.quality) return b.quality - a.quality;
        if (b.fps !== a.fps) return b.fps - a.fps;
        return (b.filesize || 0) - (a.filesize || 0);
    });

    const seen = new Set();
    const deduped = [];
    for (const f of formats) {
        const key = `${f.quality}-${f.ext}-${f.hasAudio}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(f);
    }

    if (deduped.length > 0) deduped[0].isDefault = true;
    return deduped;
}

async function getYoutubeInfo(url) {
    const normalizedUrl = normalizeYoutubeUrl(url);
    const videoId = extractYoutubeVideoId(normalizedUrl);
    if (!videoId) {
        throw new YoutubeError(YoutubeErrorCodes.INVALID_URL, 'Invalid YouTube URL');
    }

    assertBinariesAvailable();

    const { stdout } = await runYtDlp(['-J', '--no-playlist', normalizedUrl]);
    let data;
    try {
        data = JSON.parse(stdout);
    } catch {
        throw new YoutubeError(YoutubeErrorCodes.FETCH_FAILED, 'Could not parse video information from YouTube');
    }

    const formats = parseFormats(data.formats || []);
    if (formats.length === 0) {
        throw new YoutubeError(YoutubeErrorCodes.NO_FORMATS, 'No downloadable formats found for this video');
    }

    return {
        videoId,
        title: data.title || 'YouTube Video',
        thumbnail: data.thumbnail || null,
        duration: data.duration || null,
        url: normalizedUrl,
        formats,
        defaultFormatId: formats.find((f) => f.isDefault)?.formatId || formats[0]?.formatId || null,
    };
}

async function findDownloadedFile(dir) {
    const entries = await fs.readdir(dir);
    const files = entries.filter((f) => !f.endsWith('.part') && !f.endsWith('.ytdl'));
    if (files.length === 0) {
        throw new YoutubeError(YoutubeErrorCodes.DOWNLOAD_FAILED, 'Download completed but no output file was found');
    }
    return path.join(dir, files[0]);
}

async function cleanupDownloadJob(jobId) {
    const ctx = activeDownloadJobs.get(jobId);
    if (!ctx) return;

    ctx.cancelled = true;
    ctx.child?.kill('SIGKILL');

    if (ctx.tempDir) {
        await fs.rm(ctx.tempDir, { recursive: true, force: true }).catch(() => {});
        ctx.tempDir = null;
    }

    if (ctx.videoId) {
        try {
            await videoService.deleteVideoById(ctx.videoId);
        } catch (err) {
            console.error('Failed to delete cancelled YouTube video', ctx.videoId, err);
        }
        ctx.videoId = null;
    }

    activeDownloadJobs.delete(jobId);
}

async function downloadYoutubeVideo(jobId, articleId, url, formatId, meta = {}, { onProgress } = {}) {
    assertBinariesAvailable();

    const normalizedUrl = normalizeYoutubeUrl(url);
    const jobContext = {
        child: null,
        tempDir: null,
        cancelled: false,
        videoId: null,
        articleId,
    };
    activeDownloadJobs.set(jobId, jobContext);

    let tempDir = null;

    try {
        let info;
        if (meta?.title && meta?.hasAudio != null) {
            info = {
                title: meta.title,
                duration: meta.duration ?? null,
                url: normalizedUrl,
                formats: [{
                    formatId,
                    hasAudio: meta.hasAudio,
                    ext: meta.ext || 'mp4',
                    quality: meta.quality || 0,
                }],
            };
        } else {
            onProgress?.(0);
            info = await getYoutubeInfo(normalizedUrl);
        }

        if (jobContext.cancelled) {
            throw new YoutubeError(YoutubeErrorCodes.DOWNLOAD_CANCELLED, 'Download cancelled');
        }

        const selected = info.formats.find((f) => f.formatId === formatId) || info.formats[0];
        if (!selected) {
            throw new YoutubeError(YoutubeErrorCodes.NO_FORMATS, 'No downloadable formats found');
        }

        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bulutlar-yt-'));
        jobContext.tempDir = tempDir;

        const outputTemplate = path.join(tempDir, 'video.%(ext)s');
        const formatSelector = selected.hasAudio
            ? selected.formatId
            : `${selected.formatId}+bestaudio/best`;

        onProgress?.(0);

        try {
            await runYtDlp([
                '--newline',
                '--progress',
                '-f', formatSelector,
                '--merge-output-format', 'mp4',
                '-o', outputTemplate,
                '--no-playlist',
                normalizedUrl,
            ], { onProgress, jobContext });
        } catch (err) {
            if (err instanceof YoutubeError && err.code === YoutubeErrorCodes.DOWNLOAD_CANCELLED) throw err;
            if (err instanceof YoutubeError && err.code === YoutubeErrorCodes.FETCH_FAILED) {
                throw new YoutubeError(YoutubeErrorCodes.DOWNLOAD_FAILED, err.message, err.detail);
            }
            throw err;
        }

        if (jobContext.cancelled) {
            throw new YoutubeError(YoutubeErrorCodes.DOWNLOAD_CANCELLED, 'Download cancelled');
        }

        const downloadedPath = await findDownloadedFile(tempDir);
        const stat = await fs.stat(downloadedPath);
        const ext = path.extname(downloadedPath).slice(1) || selected.ext || 'mp4';

        const video = {
            name: `${info.title}.${ext}`,
            type: ext,
            path: downloadedPath,
            size: stat.size,
            description: info.title,
            duration: info.duration,
            sourceType: 'youtube',
            sourceUrl: normalizedUrl,
            width: selected.quality || null,
            height: selected.quality || null,
        };

        const videoEntity = await articleService.addVideoToArticle(articleId, video);
        jobContext.videoId = videoEntity.id;

        if (jobContext.cancelled) {
            await videoService.deleteVideoById(videoEntity.id);
            throw new YoutubeError(YoutubeErrorCodes.DOWNLOAD_CANCELLED, 'Download cancelled');
        }

        onProgress?.(100);
        return videoEntity;
    } finally {
        if (tempDir && !jobContext.cancelled) {
            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
        if (!jobContext.cancelled) {
            activeDownloadJobs.delete(jobId);
        }
    }
}

function initService() {
    ipcMain.handle('youtube/checkBinaries', async () => {
        try {
            return youtubeSuccess(getBinariesStatus());
        } catch (err) {
            return youtubeFailure(err);
        }
    });

    ipcMain.handle('youtube/getInfo', async (_event, url) => {
        try {
            return youtubeSuccess(await getYoutubeInfo(url));
        } catch (err) {
            return youtubeFailure(err);
        }
    });

    ipcMain.handle('youtube/download', async (event, jobId, articleId, url, formatId, meta = {}) => {
        try {
            sendDownloadProgress(jobId, 0);
            const data = await downloadYoutubeVideo(jobId, articleId, url, formatId, meta, {
                onProgress: (percent) => sendDownloadProgress(jobId, percent),
            });
            return youtubeSuccess(data);
        } catch (err) {
            return youtubeFailure(err);
        }
    });

    ipcMain.handle('youtube/cancelDownload', async (_event, jobId) => {
        try {
            const hadJob = activeDownloadJobs.has(jobId);
            await cleanupDownloadJob(jobId);
            return youtubeSuccess({ cancelled: hadJob });
        } catch (err) {
            return youtubeFailure(err);
        }
    });

    console.info('YoutubeService initialized');
}

const YoutubeService = {
    initService,
    getYoutubeInfo,
    downloadYoutubeVideo,
    cancelYoutubeDownload: cleanupDownloadJob,
};

export default YoutubeService;
