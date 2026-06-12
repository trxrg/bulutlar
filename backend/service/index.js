import storeService from './StoreService.js';
import adminService from './AdminService.js';
import ownerService from './OwnerService.js';
import articleService from './ArticleService.js';
import documentService from './DocumentService.js';
import tagService from './TagService.js';
import categoryService from './CategoryService.js';
import groupService from './GroupService.js';
import commentService from './CommentService.js';
import imageService from './ImageService.js';
import audioService from './AudioService.js';
import videoService from './VideoService.js';
import annotationService from './AnnotationService.js';
import lookupService from './LookupService.js';
import dbService from './DBService.js';
import urlFetchService from './UrlFetchService.js';
import sharingService from './SharingService.js';
import maintenanceService from './MaintenanceService.js';

const services = [
    storeService,
    adminService,
    ownerService,
    articleService,
    documentService,
    tagService,
    categoryService,
    groupService,
    commentService,
    imageService,
    audioService,
    videoService,
    annotationService,
    lookupService,
    dbService,
    urlFetchService,
    sharingService,
    maintenanceService,
];

function initServices() {
    for (const service of services) {
        service.initService();
    }
}

export { initServices };
