export async function ping() {
    return window.api.ping();
}

export async function checkDbConnection() {
    return window.api.checkDbConnection();
}

export async function getFromDb() {
    return window.api.getFromDb();
}