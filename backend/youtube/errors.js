export const YoutubeErrorCodes = {
    YT_DLP_MISSING: 'YT_DLP_MISSING',
    FFMPEG_MISSING: 'FFMPEG_MISSING',
    INVALID_URL: 'INVALID_URL',
    NO_FORMATS: 'NO_FORMATS',
    FETCH_FAILED: 'FETCH_FAILED',
    DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
    DOWNLOAD_CANCELLED: 'DOWNLOAD_CANCELLED',
    VIDEO_UNAVAILABLE: 'VIDEO_UNAVAILABLE',
};

export class YoutubeError extends Error {
    constructor(code, message, detail = null) {
        super(message);
        this.name = 'YoutubeError';
        this.code = code;
        this.detail = detail;
    }

    toPayload() {
        return {
            code: this.code,
            message: this.message,
            detail: this.detail,
        };
    }
}

export function toYoutubeErrorPayload(err) {
    if (err instanceof YoutubeError) return err.toPayload();

    const message = err?.message || String(err);
    const code = err?.code && YoutubeErrorCodes[err.code] ? err.code : YoutubeErrorCodes.FETCH_FAILED;

    if (err?.code === 'ENOENT' || /spawn.*enoent/i.test(message)) {
        return {
            code: YoutubeErrorCodes.YT_DLP_MISSING,
            message: 'yt-dlp executable not found',
            detail: message,
        };
    }

    if (/invalid youtube url/i.test(message)) {
        return {
            code: YoutubeErrorCodes.INVALID_URL,
            message,
            detail: null,
        };
    }

    if (/no downloadable formats/i.test(message)) {
        return {
            code: YoutubeErrorCodes.NO_FORMATS,
            message,
            detail: null,
        };
    }

    if (/video unavailable|private video|sign in to confirm|age.restricted|members.only|this live event|copyright/i.test(message)) {
        return {
            code: YoutubeErrorCodes.VIDEO_UNAVAILABLE,
            message,
            detail: null,
        };
    }

    if (/download failed|no output file/i.test(message)) {
        return {
            code: YoutubeErrorCodes.DOWNLOAD_FAILED,
            message,
            detail: null,
        };
    }

    if (/download cancelled/i.test(message)) {
        return {
            code: YoutubeErrorCodes.DOWNLOAD_CANCELLED,
            message,
            detail: null,
        };
    }

    return {
        code,
        message: message || 'YouTube operation failed',
        detail: null,
    };
}

export function youtubeSuccess(data) {
    return { ok: true, data };
}

export function youtubeFailure(err) {
    return { ok: false, error: toYoutubeErrorPayload(err) };
}
