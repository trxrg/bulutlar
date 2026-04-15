import { createWriteStream, existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import os from 'os';
import { ensureFolderExists } from '../fsOps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_DIR = path.join(__dirname, 'sample-media');
const IMAGES_DIR = path.join(MEDIA_DIR, 'images');
const VIDEOS_DIR = path.join(MEDIA_DIR, 'videos');

let audioTempDir;

async function getAudioTempDir() {
    if (!audioTempDir) {
        audioTempDir = path.join(os.tmpdir(), 'bulutlar-sample-audio-' + Date.now());
        ensureFolderExists(audioTempDir);
    }
    return audioTempDir;
}

export async function cleanup() {
    if (audioTempDir) {
        try {
            await fs.rm(audioTempDir, { recursive: true, force: true });
        } catch (e) {
            console.warn('Could not clean up audio temp dir:', e.message);
        }
    }
}

// --- Download utility ---

function downloadFile(url, destPath, maxRedirects = 10) {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                let redirectUrl = res.headers.location;
                if (redirectUrl.startsWith('/')) {
                    const parsed = new URL(url);
                    redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
                }
                return downloadFile(redirectUrl, destPath, maxRedirects - 1)
                    .then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            const ws = createWriteStream(destPath);
            res.pipe(ws);
            ws.on('finish', () => { ws.close(resolve); });
            ws.on('error', reject);
        }).on('error', reject);
    });
}

// --- Download and cache media files ---

const VIDEO_SOURCES = [
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    'https://cdn.pixabay.com/video/2024/05/31/214692_tiny.mp4',
];

let mediaReady = false;

async function ensureMediaDownloaded() {
    if (mediaReady) return;

    ensureFolderExists(MEDIA_DIR);
    ensureFolderExists(IMAGES_DIR);
    ensureFolderExists(VIDEOS_DIR);

    const imageNames = [
        'sleep-brain-waves', 'mercator-projection', 'ancient-clay-tablet-map',
        'dual-process-diagram', 'vertical-farm-layers', 'rooftop-garden',
        'sundial-ancient', 'mycorrhizal-network', 'forest-canopy',
        'suspension-bridge', 'roman-arch-bridge', 'cable-stayed-bridge',
        'ocean-depth-gradient', 'fermentation-jars', 'volcano-cross-section',
        'ring-of-fire-map', 'soil-layers-cross-section', 'cuneiform-tablet',
        'chinese-oracle-bone'
    ];

    let needsDownload = false;
    for (const name of imageNames) {
        if (!existsSync(path.join(IMAGES_DIR, `${name}.jpg`))) { needsDownload = true; break; }
    }
    for (let i = 0; i < VIDEO_SOURCES.length; i++) {
        if (!existsSync(path.join(VIDEOS_DIR, `video-${i + 1}.mp4`))) { needsDownload = true; break; }
    }

    if (!needsDownload) {
        console.log('Sample media already downloaded.');
        mediaReady = true;
        return;
    }

    console.log('Downloading sample media files (this only happens once)...');

    for (const name of imageNames) {
        const dest = path.join(IMAGES_DIR, `${name}.jpg`);
        if (existsSync(dest)) continue;
        const url = `https://picsum.photos/seed/${name}/800/600`;
        try {
            console.log(`  Downloading image: ${name}...`);
            await downloadFile(url, dest);
        } catch (e) {
            console.warn(`  Failed to download image ${name}: ${e.message}`);
        }
    }

    for (let i = 0; i < VIDEO_SOURCES.length; i++) {
        const dest = path.join(VIDEOS_DIR, `video-${i + 1}.mp4`);
        if (existsSync(dest)) continue;
        try {
            console.log(`  Downloading video ${i + 1}/${VIDEO_SOURCES.length}...`);
            await downloadFile(VIDEO_SOURCES[i], dest);
        } catch (e) {
            console.warn(`  Failed to download video ${i + 1}: ${e.message}`);
        }
    }

    console.log('Sample media download complete.');
    mediaReady = true;
}

// --- Image: use downloaded files ---

export async function generateSampleImage(name) {
    await ensureMediaDownloaded();
    const filePath = path.join(IMAGES_DIR, `${name}.jpg`);
    if (!existsSync(filePath)) {
        console.warn(`Sample image not found: ${filePath}`);
        return null;
    }
    const stat = await fs.stat(filePath);
    return { name: name + '.jpg', type: 'image/jpeg', path: filePath, size: stat.size };
}

// --- Audio: generate WAV (produces real playable audio) ---

function createWavBuffer(durationSec, sampleRate, frequency) {
    const numSamples = Math.floor(sampleRate * durationSec);
    const bytesPerSample = 2;
    const dataSize = numSamples * bytesPerSample;
    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
    buffer.writeUInt16LE(bytesPerSample, 32);
    buffer.writeUInt16LE(16, 34);

    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    const fadeFrames = Math.min(Math.floor(numSamples * 0.05), sampleRate);
    for (let i = 0; i < numSamples; i++) {
        let amplitude = 0.3;
        if (i < fadeFrames) amplitude *= i / fadeFrames;
        if (i > numSamples - fadeFrames) amplitude *= (numSamples - i) / fadeFrames;

        const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * amplitude;
        const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
        buffer.writeInt16LE(intSample, 44 + i * bytesPerSample);
    }

    return buffer;
}

export async function generateSampleAudio(name, durationSec, frequency) {
    const dir = await getAudioTempDir();
    const filePath = path.join(dir, name + '.wav');
    const sampleRate = 22050;
    const buffer = createWavBuffer(durationSec, sampleRate, frequency);
    await fs.writeFile(filePath, buffer);
    return { name: name + '.wav', type: 'audio/wav', path: filePath, size: buffer.length, duration: durationSec };
}

// --- Video: use downloaded files (cycle through available clips) ---

let videoIndex = 0;

export async function generateSampleVideo(name) {
    await ensureMediaDownloaded();
    const videoFile = `video-${(videoIndex % VIDEO_SOURCES.length) + 1}.mp4`;
    videoIndex++;
    const filePath = path.join(VIDEOS_DIR, videoFile);
    if (!existsSync(filePath)) {
        console.warn(`Sample video not found: ${filePath}`);
        return null;
    }
    const stat = await fs.stat(filePath);
    return { name: name + '.mp4', type: 'video/mp4', path: filePath, size: stat.size };
}
