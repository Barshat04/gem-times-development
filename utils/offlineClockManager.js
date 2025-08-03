import AsyncStorage from "@react-native-async-storage/async-storage";
import { addToQueue } from "./offlineQueue";

const ACTIVE_CLOCK_KEY = "activeClock";
const OFFLINE_CLOCK_ACTIONS_KEY = "offlineClockActions";

// Store active clock session
export const storeActiveClock = async (clockData) => {
  try {
    await AsyncStorage.setItem(
      ACTIVE_CLOCK_KEY,
      JSON.stringify({
        ...clockData,
        timestamp: new Date().toISOString(),
        synced: false,
      })
    );
  } catch (error) {
    console.error("Failed to store active clock:", error);
  }
};

// Get active clock session
export const getActiveClock = async () => {
  try {
    const data = await AsyncStorage.getItem(ACTIVE_CLOCK_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get active clock:", error);
    return null;
  }
};

// Clear active clock session
export const clearActiveClock = async () => {
  try {
    await AsyncStorage.removeItem(ACTIVE_CLOCK_KEY);
  } catch (error) {
    console.error("Failed to clear active clock:", error);
  }
};

// Store offline clock action
export const storeOfflineClockAction = async (action) => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_CLOCK_ACTIONS_KEY);
    const actions = existing ? JSON.parse(existing) : [];

    const newAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      synced: false,
    };

    actions.push(newAction);
    await AsyncStorage.setItem(
      OFFLINE_CLOCK_ACTIONS_KEY,
      JSON.stringify(actions)
    );

    // Also add to main offline queue for syncing
    await addToQueue({
      type: action.type,
      payload: newAction,
      timestamp: newAction.timestamp,
    });

    return newAction;
  } catch (error) {
    console.error("Failed to store offline clock action:", error);
    return null;
  }
};

// Get all offline clock actions
export const getOfflineClockActions = async () => {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_CLOCK_ACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get offline clock actions:", error);
    return [];
  }
};

// Mark clock action as synced
export const markClockActionSynced = async (actionId) => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_CLOCK_ACTIONS_KEY);
    if (!existing) return;

    const actions = JSON.parse(existing);
    const updatedActions = actions.map((action) =>
      action.id === actionId ? { ...action, synced: true } : action
    );

    await AsyncStorage.setItem(
      OFFLINE_CLOCK_ACTIONS_KEY,
      JSON.stringify(updatedActions)
    );
  } catch (error) {
    console.error("Failed to mark clock action as synced:", error);
  }
};

// Clean up synced actions (optional cleanup)
export const cleanupSyncedActions = async () => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_CLOCK_ACTIONS_KEY);
    if (!existing) return;

    const actions = JSON.parse(existing);
    const unsyncedActions = actions.filter((action) => !action.synced);

    await AsyncStorage.setItem(
      OFFLINE_CLOCK_ACTIONS_KEY,
      JSON.stringify(unsyncedActions)
    );
  } catch (error) {
    console.error("Failed to cleanup synced actions:", error);
  }
};
