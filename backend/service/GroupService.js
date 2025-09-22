import { ipcMain } from 'electron';
import { sequelize } from "../sequelize/index.js";

function initService() {
    ipcMain.handle('group/create', (event, group) => createGroup(group));
    ipcMain.handle('group/updateName', (event, id, newName) => updateGroupName(id, newName));
    ipcMain.handle('group/getAll', getAllGroups);
    ipcMain.handle('group/getById', (event, id) => getGroupById(id));
    ipcMain.handle('group/addArticles', (event, groupName, articleIds) => addArticlesToGroup(groupName, articleIds));
    ipcMain.handle('group/deleteById', (event, id) => deleteGroupById(id));
    ipcMain.handle('group/updateOrdering', (event, groupId, ordering) => updateGroupOrdering(groupId, ordering));
    ipcMain.handle('group/updateOrderings', (event, orderings) => updateGroupOrderings(orderings));
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
        
        if (!group)
            throw ('no group found with id: ' + id);

        await group.destroy();

    } catch (err) {
        console.error('Error in deleteGroup', err);
        throw err;
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

async function addArticlesToGroup(groupName, articleIds) {
    try {
        const group = await getGroupWithNameAddIfNotPresent(groupName);
        await group.addArticles(articleIds);
    } catch (e) {
        console.error('Error adding articles to group:', e);
        throw e;
    }
}

async function updateGroupOrdering(groupId, ordering) {
    try {
        const group = await sequelize.models.group.findByPk(groupId);
        
        if (!group) {
            throw new Error('Group not found');
        }
        
        await group.update({ ordering });
        return group;
    } catch (error) {
        console.error('Error updating group ordering', error);
        throw error;
    }
}

async function updateGroupOrderings(orderings) {
    try {
        // Update multiple group orderings in a transaction
        const transaction = await sequelize.transaction();
        
        try {
            for (const { groupId, ordering } of orderings) {
                await sequelize.models.group.update(
                    { ordering: ordering },
                    { 
                        where: { id: groupId },
                        transaction
                    }
                );
            }
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error updating group orderings', error);
        throw error;
    }
}

const GroupService = {
    addGroup: createGroup,
    getGroupWithNameAddIfNotPresent,
    getGroupById,
    updateGroupOrdering,
    updateGroupOrderings,
    initService
};

export default GroupService;
