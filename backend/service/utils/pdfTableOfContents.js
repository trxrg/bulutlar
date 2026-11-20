import { PDFDocument, PDFName, PDFArray, PDFDict, PDFRef, PDFNumber, PDFNull, PDFString, PDFHexString } from 'pdf-lib';
import { TOC_ARTICLE_ANCHOR_PREFIX } from './htmlGeneration.js';

/*
 * Chromium's printToPDF turns in-document links (<a href="#id">) into Link
 * annotations with a named /Dest, and records every linked target in the
 * catalog's /Dests dictionary as [pageRef /XYZ left top zoom]. The contents
 * section links each line to its article's title, so from the generated PDF we
 * can read:
 *   - the page where each article starts (from /Dests), and
 *   - where each contents line sits (from the Link annotation's /Rect).
 */

const pageIndexByRef = (pdfDoc) => {
    const map = new Map();
    pdfDoc.getPages().forEach((page, index) => map.set(page.ref.toString(), index));
    return map;
};

const destName = (value) => {
    if (value instanceof PDFName) return value.decodeText();
    if (value instanceof PDFString || value instanceof PDFHexString) return value.decodeText();
    return null;
};

const parseArticleIndex = (name) => {
    if (!name || !name.startsWith(TOC_ARTICLE_ANCHOR_PREFIX)) return null;
    const index = Number(name.slice(TOC_ARTICLE_ANCHOR_PREFIX.length));
    return Number.isInteger(index) ? index : null;
};

/** 0-based page index where each article title appears (null if not found). */
function readArticleStartPages(pdfDoc, articleCount) {
    const startPages = new Array(articleCount).fill(null);
    const dests = pdfDoc.catalog.lookupMaybe(PDFName.of('Dests'), PDFDict);
    if (!dests) return startPages;

    const pageIndices = pageIndexByRef(pdfDoc);
    for (const [key, value] of dests.entries()) {
        const articleIndex = parseArticleIndex(key.decodeText());
        if (articleIndex == null || articleIndex >= articleCount) continue;
        const dest = pdfDoc.context.lookup(value);
        if (!(dest instanceof PDFArray)) continue;
        const pageRef = dest.get(0);
        if (!(pageRef instanceof PDFRef)) continue;
        const pageIndex = pageIndices.get(pageRef.toString());
        if (pageIndex != null) startPages[articleIndex] = pageIndex;
    }
    return startPages;
}

/** Location of each contents line: { pageIndex, rect: [x1, y1, x2, y2] } (null if not found). */
function readContentsEntries(pdfDoc, articleCount) {
    const entries = new Array(articleCount).fill(null);
    pdfDoc.getPages().forEach((page, pageIndex) => {
        const annots = page.node.Annots();
        if (!annots) return;
        for (let i = 0; i < annots.size(); i++) {
            const annot = annots.lookup(i);
            if (!(annot instanceof PDFDict)) continue;
            if (annot.get(PDFName.of('Subtype')) !== PDFName.of('Link')) continue;
            const articleIndex = parseArticleIndex(destName(annot.get(PDFName.of('Dest'))));
            if (articleIndex == null || articleIndex >= articleCount) continue;
            const rect = annot.lookupMaybe(PDFName.of('Rect'), PDFArray);
            if (!rect || rect.size() < 4) continue;
            const coords = [0, 1, 2, 3].map((k) => rect.lookup(k, PDFNumber).asNumber());
            // A line that wraps produces one annotation per fragment; keep the first.
            if (!entries[articleIndex]) entries[articleIndex] = { pageIndex, rect: coords };
        }
    });
    return entries;
}

/** Load a Chromium PDF and return the 1-based page number where each article starts. */
export async function readArticlePageNumbers(pdfBuffer, articleCount) {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
    return readArticleStartPages(pdfDoc, articleCount).map((index) => (index == null ? null : index + 1));
}

/**
 * Add a link over the footer of every article page pointing to that article's
 * line in the contents section. Pages before the first article and the contents
 * pages themselves link to the top of the contents.
 */
export async function addContentsLinks(pdfBuffer, articleCount, { footerHeightPt }) {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
    const pages = pdfDoc.getPages();
    const startPages = readArticleStartPages(pdfDoc, articleCount);
    const entries = readContentsEntries(pdfDoc, articleCount);

    const tocPages = entries.filter(Boolean).map((e) => e.pageIndex);
    if (tocPages.length === 0) return pdfBuffer;
    const firstTocPage = Math.min(...tocPages);

    const destFor = (entry) => {
        const page = pages[entry.pageIndex];
        // Land a little above the line so it is not flush with the window edge.
        const top = Math.min(page.getHeight(), Math.max(entry.rect[1], entry.rect[3]) + 12);
        return [page.ref, PDFName.of('XYZ'), PDFNull, PDFNumber.of(top), PDFNull];
    };
    const tocTopDest = [pages[firstTocPage].ref, PDFName.of('XYZ'), PDFNull, PDFNumber.of(pages[firstTocPage].getHeight()), PDFNull];

    pages.forEach((page, pageIndex) => {
        // The article this page belongs to: the last one starting on or before it.
        let articleIndex = -1;
        if (pageIndex < firstTocPage) {
            startPages.forEach((start, i) => {
                if (start != null && start <= pageIndex) articleIndex = i;
            });
        }
        const entry = articleIndex >= 0 ? entries[articleIndex] : null;
        const dest = entry ? destFor(entry) : tocTopDest;

        const annot = pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [0, 0, page.getWidth(), footerHeightPt],
            Border: [0, 0, 0],
            Dest: dest,
        });
        page.node.addAnnot(pdfDoc.context.register(annot));
    });

    return Buffer.from(await pdfDoc.save());
}
