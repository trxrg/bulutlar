const services = [
    require('./OwnerService'),
    require('./ArticleService'),
    require('./TagService'),
    require('./CategoryService')
];

function initServices() {
    for (const service of services)
        service.initService();
}

module.exports = { initServices }