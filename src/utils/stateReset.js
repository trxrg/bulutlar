import { storeApi } from '../backend-adapter/BackendAdapter.js';

/**
 * List of persistent state keys that should be reset when errors occur.
 * Add any state keys here that might cause errors and should be cleared on error.
 */
export const RESETTABLE_STATE_KEYS = [
    // Search-related states
    'sidePanelCollapsed',
    'selectedOwnerNames',
    'selectedTagNames',
    'selectedCategoryNames',
    'selectedGroupNames',
    'selectedNumbers1',
    'selectedNumbers2',
    'keywords',
    'quickSearchTerm',
    'searchInTitle',
    'searchInExplanation',
    'searchInMainText',
    'searchInComments',
    'startDate',
    'endDate',
    'startDate2',
    'endDate2',
    'filterStarred',
];

/**
 * Resets specific persistent state keys
 * @param {string[]} keys - Array of state keys to reset
 */
export const resetStateKeys = async (keys) => {
    try {
        await storeApi.deleteMany(keys);
        console.log('Successfully reset state keys:', keys);
        return true;
    } catch (error) {
        console.error('Error resetting state keys:', error);
        return false;
    }
};

/**
 * Resets all persistent states defined in RESETTABLE_STATE_KEYS
 */
export const resetAllResettableStates = async () => {
    return await resetStateKeys(RESETTABLE_STATE_KEYS);
};

/**
 * Clears all persistent states (use with caution!)
 */
export const clearAllStates = async () => {
    try {
        await storeApi.clear();
        console.log('Successfully cleared all persistent states');
        return true;
    } catch (error) {
        console.error('Error clearing all states:', error);
        return false;
    }
};

