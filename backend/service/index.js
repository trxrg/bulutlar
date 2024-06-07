const services = [
    require('./OwnerService'),
    require('./ArticleService'),
    require('./TagService')
];

function initServices() {
    for (const service of services)
        service.initService();
}

module.exports = { initServices }