import { ipcMain } from 'electron';
import { sequelize } from "../sequelize/index.js";

function initService() {
    ipcMain.handle('group/create', (event, group) => createGroup(group));
    ipcMain.handle('group/updateName', (event, id, newName) => updateGroupName(id, newName));
    ipcMain.handle('group/getAll', getAllGroups);
    ipcMain.handle('group/getById', (event, id) => getGroupById(id));
    ipcMain.handle('group/deleteById', (event, id) => deleteGroupById(id));
}

async function createGroup(group) {
    try {
        const result = await sequelize.models.group.create({ name: group.name.trim() });
        return result.dataValues;
    } catch (e) {
        return {error: e};
    }
}

async function updateGroupName(groupId, newName) {
    try {
        const group = await sequelize.models.group.findByPk(groupId);
        const result = await group.update({ name: newName });
        return result.dataValues;
    } catch (e) {
        console.error('Error updating group name:', e);
        return {error: e};
    }
}

async function getGroupById(id) {
    const result = await sequelize.models.group.findByPk(id);
    if (!result)
        return {error: 'Group not found'};

    result.dataValues.articleCount = await result.countArticles();
    return result.dataValues;
}

async function deleteGroupById(id) {
    try {
        const group = await sequelize.models.group.findByPk(id);
        const articleCount = await group.countArticles();
        
        if (articleCount > 0)
            throw ('Cannot delete group with articles');
        
        if (!group)
            throw ('no group found with id: ' + id);

        await group.destroy();

    } catch (err) {
        console.error('Error in deleteGroup', err);
    }
}

async function getGroupWithName(groupName, transaction) {
    return await sequelize.models.group.findOne({ where: { name: groupName }, transaction });
}

async function getGroupWithNameAddIfNotPresent(groupName, transaction = null) {
    let result = await getGroupWithName(groupName, transaction);
    if (!result)
        result = await sequelize.models.group.create({ name: groupName }, { transaction });

    return result;
}

async function getAllGroups() {
    const result = await sequelize.models.group.findAll();

    if (!result)
        return { error: 'No groups found' };

    const d = await Promise.all(result.map(async item => {
        const data = item.dataValues;
        data.articleCount = await item.countArticles();
        return data;
    }));
    return d;
}

const GroupService = {
    addGroup: createGroup,
    getGroupWithNameAddIfNotPresent,
    initService
};

export default GroupService;
