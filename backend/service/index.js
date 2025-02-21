const servicePromises = [
    import('./OwnerService.js'),
    import('./ArticleService.js'),
    import('./TagService.js'),
    import('./CategoryService.js'),
    import('./GroupService.js'),
    import('./CommentService.js'),
    import('./ImageService.js'),
    import('./AnnotationService.js'),
    import('./LookupService.js'),
    import('./DBService.js'),
];

function initServices() {
    Promise.all(servicePromises).then(modules => {
        const services = modules.map(module => module.default);
        for (const service of services)
            service.initService();
    });
}

export { initServices }