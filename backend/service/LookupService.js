const { ipcMain } = require('electron')
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('lookup/create', (event, lookup) => createLookup(lookup));
    ipcMain.handle('lookup/getByLabel', (event, label) => getLookupByLabel(label));
    ipcMain.handle('lookup/updateValue', (event, label, value) => updateValue(label, value));
    ipcMain.handle('lookup/setLastActiveDateToToday', (event) => setLastActiveDateToToday());
}

async function createLookup(lookup) {
    try {
        const result = await sequelize.models.lookup.create(lookup);

        return result;
    } catch (err) {
        console.error('Error in createLookup ', err);
        throw err;
    }
}

async function getLookupByLabel(label) {
    try {
        const lookup = await sequelize.models.lookup.findOne({
            where: {
                label: label
            }
        });

        if (!lookup)
            throw ('no lookup found with label: ' + label);

        return lookup.dataValues;
    } catch (err) {
        throw err;
    }
}

async function updateValue(label, value) {
    try {
        const lookup = await sequelize.models.lookup.findOne({
            where: {
                label: label
            }
        });

        if (!lookup)
            throw ('no lookup found with label: ' + label);

        lookup.value = value;
        await lookup.save();

        return lookup.dataValues;
    } catch (err) {
        console.error('Error in updateValue', err);
        throw err;
    }
}

const getOrCreateLookup = async (label, defaultValue) => {
    try {
        return await getLookupByLabel(label);
    } catch (err) {
        console.warn('Lookup not found, creating new one with default value', label, defaultValue);
        await createLookup({ label, value: defaultValue });
        return await getLookupByLabel(label);
    }
};

const removeTimeFromDate = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

async function setLastActiveDateToToday() {
    try {
        const today = removeTimeFromDate(new Date());
        await updateValue('lastActiveDate', today);
    } catch (err) {
        console.error('Error in setLastActiveDateToToday', err);
        throw err;
    }
}

module.exports = {
    initService,
    getLookupByLabel,
    createLookup,
    updateValue,
    getOrCreateLookup,
    removeTimeFromDate,
};
