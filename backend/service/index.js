const serviceInits = [
    require('./OwnerService')
];

function initServices() {
    for (const serviceInit of serviceInits)
        serviceInit();
}

module.exports = { initServices }