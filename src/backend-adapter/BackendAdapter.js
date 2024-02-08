export async function ping() {
    return window.api.ping();
}

export async function checkDbConnection() {
    return window.api.checkDbConnection();
}

export async function getFromDb() {
    return window.api.getFromDb();
}

export async function getAllArticles() {
    return window.api.getAllArticles();
}

export async function addOwnerAndArticle() {
    return window.api.addOwnerAndArticle();
}

export async function addOwner(ownerName) {
    return window.api.addOwner(ownerName);
}

export async function updateOwnerName(ownerName, newName) {
    return window.api.updateOwnerName(ownerName, newName);
}

export async function getOwnerWithName(ownerName) {
    return window.api.getOwnerWithName(ownerName);
}

export async function getAllOwners() {
    return window.api.getAllOwners();
}