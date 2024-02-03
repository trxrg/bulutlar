const { initService } = require('./service1/service1')

function initServices() {
    initService();
}

module.exports = { initServices }