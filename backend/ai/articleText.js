// Turns an article (with its comments, annotations, tags, owner, category)
// into plain text for the model's context. Pure function, no I/O.

import { convert } from 'html-to-text';

const HTML_OPTIONS = {
    wordwrap: false,
    selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
        { selector: 'video', format: 'skip' },
        { selector: 'audio', format: 'skip' },
        { selector: 'iframe', format: 'skip' },
        { selector: 'h1', options: { uppercase: false } },
        { selector: 'h2', options: { uppercase: false } },
        { selector: 'h3', options: { uppercase: false } },
        { selector: 'table', format: 'dataTable' },
    ],
};

export function htmlToPlain(html) {
    if (!html || typeof html !== 'string') return '';
    return convert(html, HTML_OPTIONS).replace(/\n{3,}/g, '\n\n').trim();
}

function formatDate(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

/**
 * @param {object} article plain object with title, date, text, explanation,
 *   comments[{text}], annotations[{quote, note}], tags[{name}],
 *   owner{name}, category{name}
 * @returns {{ header: string, body: string }}
 */
export function buildArticleText(article) {
    const headerLines = [`Title: ${article.title ?? ''}`];
    const date = formatDate(article.date);
    if (date) headerLines.push(`Date: ${date}${article.isDateUncertain ? ' (uncertain)' : ''}`);
    if (article.owner?.name) headerLines.push(`Author: ${article.owner.name}`);
    if (article.category?.name) headerLines.push(`Category: ${article.category.name}`);
    const tags = (article.tags || []).map((t) => t.name).filter(Boolean);
    if (tags.length) headerLines.push(`Tags: ${tags.join(', ')}`);

    const sections = [];
    const explanation = htmlToPlain(article.explanation);
    if (explanation) sections.push(`## Explanation\n${explanation}`);

    const main = htmlToPlain(article.text);
    if (main) sections.push(`## Text\n${main}`);

    const comments = (article.comments || []).map((c) => htmlToPlain(c.text)).filter(Boolean);
    if (comments.length) sections.push(`## Comments\n${comments.join('\n\n')}`);

    const annotations = (article.annotations || [])
        .map((a) => {
            const quote = (a.quote || '').trim();
            const note = (a.note || '').trim();
            if (!quote && !note) return null;
            return quote ? `> ${quote}${note ? `\nNote: ${note}` : ''}` : `Note: ${note}`;
        })
        .filter(Boolean);
    if (annotations.length) sections.push(`## Annotations\n${annotations.join('\n\n')}`);

    return { header: headerLines.join('\n'), body: sections.join('\n\n') };
}

export function buildSystemPrompt(articleText, { truncated = false } = {}) {
    return [
        'You are a reading assistant inside Bulutlar, a personal article archive.',
        'Answer questions about the article below. Base your answers only on the article;',
        'if the article does not contain the answer, say so plainly instead of guessing.',
        'Quote short passages when it helps. Reply in the language the user writes in.',
        truncated ? 'Note: the article was too long and has been cut off; mention this if the answer may be in the missing part.' : null,
        '',
        '<article>',
        articleText,
        '</article>',
    ].filter((l) => l !== null).join('\n');
}
