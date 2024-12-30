const services = [
    require('./OwnerService'),
    require('./ArticleService'),
    require('./TagService'),
    require('./CategoryService'),
    require('./CommentService'),
    require('./ImageService'),
    require('./AnnotationService'),
    require('./LookupService'),
    require('./DBService'),
];

function initServices() {
    for (const service of services)
        service.initService();
}

module.exports = { initServices }