const serviceInits = [
    require('./OwnerService'),
    require('./ArticleService'),
    require('./TagService')
];

function initServices() {
    for (const serviceInit of serviceInits)
        serviceInit();
}

module.exports = { initServices }