const services = [
    require('./OwnerService'),
    require('./ArticleService'),
    require('./TagService'),
    require('./CategoryService'),
    require('./CommentService'),
    require('./ImageService'),
    require('./AnnotationService'),
];

function initServices() {
    for (const service of services)
        service.initService();
}

module.exports = { initServices }