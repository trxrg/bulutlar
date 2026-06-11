import { describe, it, expect } from 'vitest';
import { stripHtmlMediaById } from './htmlResolve.js';

describe('stripHtmlMediaById', () => {
    it('removes media elements whose id is in the deleted set', async () => {
        const html = '<p>before</p><div data-type="imageNode" id="42" name="x"></div><p>after</p>';
        const idSet = new Set([42, '42']);
        const { html: out, changed } = await stripHtmlMediaById(html, idSet);
        expect(changed).toBe(true);
        expect(out).not.toContain('imageNode');
        expect(out).toContain('before');
        expect(out).toContain('after');
    });

    it('leaves media elements whose id is not deleted', async () => {
        const html = '<div data-type="imageNode" id="99"></div>';
        const idSet = new Set([42]);
        const { html: out, changed } = await stripHtmlMediaById(html, idSet);
        expect(changed).toBe(false);
        expect(out).toContain('imageNode');
    });

    it('is a no-op for empty input', async () => {
        const { html: out, changed } = await stripHtmlMediaById(null, new Set([1]));
        expect(changed).toBe(false);
        expect(out).toBeNull();
    });
});
