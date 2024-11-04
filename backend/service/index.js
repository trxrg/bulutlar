const services = [
    require('./OwnerService'),
    require('./ArticleService'),
    require('./TagService'),
    require('./CategoryService'),
    require('./CommentService'),
    require('./ImageService'),
    require('./AnnotationService'),
    require('./LookupService'),
];

function initServices() {
    for (const service of services)
        service.initService();
}

module.exports = { initServices }