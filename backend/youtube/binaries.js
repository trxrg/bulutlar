import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { app } from 'electron';
import ffmpegPath from 'ffmpeg-static';
import { YoutubeError, YoutubeErrorCodes } from './errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function projectRoot() {
    return path.resolve(__dirname, '../..');
}

function platformKey() {
    if (process.platform === 'darwin') return 'mac';
    if (process.platform === 'win32') return 'win';
    return 'linux';
}

function ytDlpFileName() {
    return process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
}

function resolveYtDlpCandidates() {
    const fileName = ytDlpFileName();
    const key = platformKey();
    const candidates = [];

    if (app?.isPackaged) {
        candidates.push(path.join(process.resourcesPath, 'bin', fileName));
    }

    candidates.push(path.join(projectRoot(), 'resources', 'bin', key, fileName));

    return candidates;
}

export function getYtDlpPath() {
    for (const candidate of resolveYtDlpCandidates()) {
        if (fs.existsSync(candidate)) return candidate;
    }

    return ytDlpFileName();
}

export function getFfmpegPath() {
    if (ffmpegPath && fs.existsSync(ffmpegPath)) return ffmpegPath;
    return 'ffmpeg';
}

export function getBinariesStatus() {
    const ytDlpCandidates = resolveYtDlpCandidates();
    const ytDlpPath = ytDlpCandidates.find((candidate) => fs.existsSync(candidate)) || null;
    const ffmpegResolved = getFfmpegPath();
    const ffmpegBundled = ffmpegPath && fs.existsSync(ffmpegPath);
    const ffmpegPathExists = ffmpegResolved !== 'ffmpeg' && fs.existsSync(ffmpegResolved);

    return {
        ytDlp: {
            ok: Boolean(ytDlpPath),
            path: ytDlpPath,
            expectedPath: ytDlpCandidates[ytDlpCandidates.length - 1] || null,
        },
        ffmpeg: {
            ok: ffmpegPathExists || ffmpegBundled,
            path: ffmpegResolved,
            bundled: ffmpegBundled,
        },
    };
}

export function assertBinariesAvailable({ requireFfmpeg = true } = {}) {
    const status = getBinariesStatus();

    if (!status.ytDlp.ok) {
        throw new YoutubeError(
            YoutubeErrorCodes.YT_DLP_MISSING,
            'yt-dlp is not installed or bundled with the app',
            status.ytDlp.expectedPath,
        );
    }

    if (requireFfmpeg && !status.ffmpeg.ok) {
        throw new YoutubeError(
            YoutubeErrorCodes.FFMPEG_MISSING,
            'ffmpeg is not available for merging video and audio',
            status.ffmpeg.path,
        );
    }

    return status;
}
