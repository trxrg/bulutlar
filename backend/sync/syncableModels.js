// Single source of truth for the set of Sequelize models that participate in
// the desktop->mobile sync surface. Every row in these tables carries a
// `uuid` (UUIDv7) and `revision` (INTEGER) maintained automatically by the
// hooks registered in ./hooks.js.
//
// Names match Sequelize's lower-case singular form (i.e. the keys you find in
// `sequelize.models`). The three trailing entries are the junction tables
// defined in backend/sequelize/relations.js.
export const SYNCABLE_MODELS = [
    'owner',
    'article',
    'tag',
    'category',
    'group',
    'comment',
    'annotation',
    'image',
    'audio',
    'video',
    'article_tag_rel',
    'article_group_rel',
    'article_article_rel',
];
