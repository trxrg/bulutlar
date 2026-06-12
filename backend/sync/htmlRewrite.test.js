import { describe, it, expect } from 'vitest';
import { rewriteHtml } from './htmlRewrite.js';
import { resolveHtmlMedia } from './htmlResolve.js';

describe('rewriteHtml', () => {
    it('rewrites local id to uuid and strips desktop-only attrs', async () => {
        const html = '<div data-type="imageNode" id="42" path="images/foo.jpg" type="image/jpeg" size="100" name="pic" description="desc"></div>';
        const idToUuid = new Map([[42, 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee']]);
        const { html: out, changed } = await rewriteHtml(html, idToUuid);
        expect(changed).toBe(true);
        expect(out).toContain('uuid="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"');
        expect(out).toContain('name="pic"');
        expect(out).toContain('description="desc"');
        expect(out).not.toContain('id="42"');
        expect(out).not.toContain('path=');
        expect(out).not.toMatch(/\stype="/);
        expect(out).not.toContain('size=');
    });

    it('resolves uuid from path when id is missing', async () => {
        const uuid = '11111111-2222-3333-4444-555555555555';
        const html = `<div data-type="audioNode" path="audios/${uuid}.mp3" type="audio/mpeg" duration="12"></div>`;
        const { html: out, changed } = await rewriteHtml(html, new Map());
        expect(changed).toBe(true);
        expect(out).toContain(`uuid="${uuid}"`);
        expect(out).not.toContain('path=');
        expect(out).not.toContain('duration=');
    });

    it('preserves name and description without uuid when unresolvable', async () => {
        const html = '<div data-type="videoNode" id="9" path="videos/old.mp4" name="clip"></div>';
        const { html: out, changed } = await rewriteHtml(html, new Map());
        expect(changed).toBe(true);
        expect(out).not.toContain('uuid=');
        expect(out).not.toContain('id=');
        expect(out).not.toContain('path=');
        expect(out).toContain('name="clip"');
    });

    it('is a no-op for empty or non-media HTML', async () => {
        expect((await rewriteHtml(null, new Map())).changed).toBe(false);
        expect((await rewriteHtml('<p>hello</p>', new Map())).changed).toBe(false);
    });

    it('round-trips export rewrite then import resolve', async () => {
        const uuid = '018f3a2b-7c3d-7000-8000-000000000099';
        const path = `${uuid}.jpg`;
        const exportedHtml = '<div data-type="imageNode" id="7" path="' + path + '" type="jpeg" name="pic"></div>';
        const idToUuid = new Map([[7, uuid]]);
        const { html: wireHtml } = await rewriteHtml(exportedHtml, idToUuid);
        expect(wireHtml).toContain(`uuid="${uuid}"`);
        expect(wireHtml).not.toContain('id="7"');

        const receiverInfo = {
            id: 201,
            uuid,
            name: 'pic',
            type: 'jpeg',
            path,
            size: 50,
            description: null,
        };
        const { html: importedHtml, changed } = await resolveHtmlMedia(
            wireHtml,
            new Map([[uuid, receiverInfo]]),
        );
        expect(changed).toBe(true);
        expect(importedHtml).toContain('id="201"');
        expect(importedHtml).toContain(`path="${path}"`);
    });
});
