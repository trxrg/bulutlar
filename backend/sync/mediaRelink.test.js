import { describe, it, expect } from 'vitest';
import {
    buildMediaInfoLookup,
    lookupMediaInfo,
    relinkTiptapMedia,
} from './mediaRelink.js';
import { resolveHtmlMedia } from './htmlResolve.js';

const UUID = '018f3a2b-7c3d-7000-8000-000000000001';
const PATH = `${UUID}.jpg`;

const info = {
    id: 42,
    uuid: UUID,
    name: 'photo.jpg',
    type: 'jpeg',
    path: PATH,
    size: 100,
    description: 'photo.jpg',
};

describe('mediaRelink', () => {
    it('lookupMediaInfo finds row by wrong id when path matches', () => {
        const lookup = buildMediaInfoLookup([info]);
        const found = lookupMediaInfo({ id: 99, path: PATH }, lookup);
        expect(found).toMatchObject(info);
    });

    it('lookupMediaInfo finds row by uuid parsed from path', () => {
        const lookup = buildMediaInfoLookup([info]);
        const found = lookupMediaInfo({ id: 99, path: PATH }, lookup);
        expect(found?.id).toBe(42);
    });

    it('relinkTiptapMedia fixes stale id', () => {
        const lookup = buildMediaInfoLookup([info]);
        const doc = {
            type: 'doc',
            content: [{ type: 'imageNode', attrs: { id: 99, path: PATH, name: 'photo.jpg' } }],
        };
        const { doc: out, changed } = relinkTiptapMedia(doc, lookup);
        expect(changed).toBe(true);
        expect(out.content[0].attrs.id).toBe(42);
        expect(out.content[0].attrs.path).toBe(PATH);
    });

    it('resolveHtmlMedia fixes stale id via path lookup', async () => {
        const mediaInfoByUuid = new Map([[UUID, info]]);
        const html = `<div data-type="imageNode" id="99" path="${PATH}" name="photo.jpg"></div>`;
        const { html: out, changed } = await resolveHtmlMedia(html, mediaInfoByUuid);
        expect(changed).toBe(true);
        expect(out).toContain('id="42"');
        expect(out).toContain(`path="${PATH}"`);
    });
});
