/**
 * Pure JavaScript metadata extractor using HTML5 media elements
 * No external dependencies required - works entirely in the browser
 */

export class MediaMetadataExtractor {
    /**
     * Extract video metadata using a hidden video element
     * @param {string} videoUrl - The media-file:// URL
     * @returns {Promise<object>} - Metadata object with duration, width, height
     */
    static async extractVideoMetadata(videoUrl) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.style.display = 'none';
            video.preload = 'metadata';
            
            const cleanup = () => {
                document.body.removeChild(video);
            };
            
            video.addEventListener('loadedmetadata', () => {
                const metadata = {
                    duration: Math.round(video.duration),
                    width: video.videoWidth,
                    height: video.videoHeight
                };
                
                console.log('✅ Video metadata extracted:', metadata);
                cleanup();
                resolve(metadata);
            });
            
            video.addEventListener('error', (e) => {
                console.error('❌ Video metadata extraction failed:', e);
                cleanup();
                reject(new Error(`Failed to load video metadata: ${e.message}`));
            });
            
            // Timeout after 30 seconds
            const timeout = setTimeout(() => {
                console.error('❌ Video metadata extraction timeout');
                cleanup();
                reject(new Error('Metadata extraction timeout'));
            }, 30000);
            
            video.addEventListener('loadedmetadata', () => {
                clearTimeout(timeout);
            });
            
            document.body.appendChild(video);
            video.src = videoUrl;
        });
    }
    
    /**
     * Extract audio metadata using a hidden audio element
     * @param {string} audioUrl - The media-file:// URL
     * @returns {Promise<object>} - Metadata object with duration
     */
    static async extractAudioMetadata(audioUrl) {
        return new Promise((resolve, reject) => {
            const audio = document.createElement('audio');
            audio.style.display = 'none';
            audio.preload = 'metadata';
            
            const cleanup = () => {
                document.body.removeChild(audio);
            };
            
            audio.addEventListener('loadedmetadata', () => {
                const metadata = {
                    duration: Math.round(audio.duration)
                };
                
                console.log('✅ Audio metadata extracted:', metadata);
                cleanup();
                resolve(metadata);
            });
            
            audio.addEventListener('error', (e) => {
                console.error('❌ Audio metadata extraction failed:', e);
                cleanup();
                reject(new Error(`Failed to load audio metadata: ${e.message}`));
            });
            
            // Timeout after 30 seconds
            const timeout = setTimeout(() => {
                console.error('❌ Audio metadata extraction timeout');
                cleanup();
                reject(new Error('Metadata extraction timeout'));
            }, 30000);
            
            audio.addEventListener('loadedmetadata', () => {
                clearTimeout(timeout);
            });
            
            document.body.appendChild(audio);
            audio.src = audioUrl;
        });
    }
}
