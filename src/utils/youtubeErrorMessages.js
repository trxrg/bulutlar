const CODE_TO_KEY = {
    YT_DLP_MISSING: 'youtubeErrorYtDlpMissing',
    FFMPEG_MISSING: 'youtubeErrorFfmpegMissing',
    INVALID_URL: 'youtubeErrorInvalidUrl',
    NO_FORMATS: 'youtubeErrorNoFormats',
    FETCH_FAILED: 'youtubeErrorFetchFailed',
    DOWNLOAD_FAILED: 'youtubeErrorDownloadFailed',
    VIDEO_UNAVAILABLE: 'youtubeErrorVideoUnavailable',
};

export function getYoutubeErrorPayload(error) {
    if (!error) return null;

    if (error.youtubeError) return error.youtubeError;

    const message = error?.message;
    if (typeof message === 'string') {
        try {
            const parsed = JSON.parse(message);
            if (parsed?.code) return parsed;
        } catch {
            // not JSON
        }
    }

    return {
        code: 'FETCH_FAILED',
        message: message || 'Unknown error',
        detail: null,
    };
}

export function resolveYoutubeErrorMessage(error, t) {
    const payload = getYoutubeErrorPayload(error);
    if (!payload) return t('youtubeErrorFetchFailed');

    const key = CODE_TO_KEY[payload.code] || CODE_TO_KEY.FETCH_FAILED;
    const translated = t(key);

    if (payload.detail && translated.includes('{{detail}}')) {
        return translated.replace('{{detail}}', payload.detail);
    }

    if (payload.detail && payload.code === 'YT_DLP_MISSING') {
        return `${translated}\n${payload.detail}`;
    }

    if (translated !== key) return translated;

    return payload.message || t('youtubeErrorFetchFailed');
}
