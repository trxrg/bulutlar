export function normalizeYoutubeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

export function extractYoutubeVideoId(url) {
    if (!url || typeof url !== 'string') return null;

    try {
        const parsed = new URL(normalizeYoutubeUrl(url));
        const host = parsed.hostname.replace(/^www\./, '');

        if (host === 'youtu.be') {
            const id = parsed.pathname.slice(1).split('/')[0];
            return id || null;
        }

        if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
            const v = parsed.searchParams.get('v');
            if (v) return v;

            const parts = parsed.pathname.split('/').filter(Boolean);
            const embedIdx = parts.indexOf('embed');
            if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];

            const shortsIdx = parts.indexOf('shorts');
            if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
        }
    } catch {
        return null;
    }

    return null;
}
