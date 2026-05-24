import storeService from './StoreService.js';
import adminService from './AdminService.js';

const servicePromises = [
    import('./OwnerService.js'),
    import('./ArticleService.js'),
    import('./DocumentService.js'),
    import('./TagService.js'),
    import('./CategoryService.js'),
    import('./GroupService.js'),
    import('./CommentService.js'),
    import('./ImageService.js'),
    import('./AudioService.js'),
    import('./VideoService.js'),
    import('./AnnotationService.js'),
    import('./LookupService.js'),
    import('./DBService.js'),
    import('./UrlFetchService.js'),
    import('./SharingService.js'),
    import('./MaintenanceService.js'),
];

function initServices() {
    storeService.initService();
    adminService.initService();

    Promise.all(servicePromises).then(modules => {
        for (const module of modules) {
            module.default.initService();
        }
    });
}

export { initServices };
