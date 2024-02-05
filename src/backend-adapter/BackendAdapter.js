export async function ping() {
    return window.api.ping();
}

export async function checkDbConnection() {
    return window.api.checkDbConnection();
}

export async function getFromDb() {
    return window.api.getFromDb();
}

export async function getAllOwners() {
    return window.api.getAllOwners();
}

export async function getAllArticles() {
    return window.api.getAllArticles();
}

export async function addOwnerAndArticle() {
    return window.api.addOwnerAndArticle();
}
