import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "offlineQueue";

export const addToQueue = async (action) => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push(action);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to add to queue", e);
  }
};

export const getQueue = async () => {
  const data = await AsyncStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearQueue = async () => {
  await AsyncStorage.removeItem(QUEUE_KEY);
};

//to only remove processed items
export const removeFromQueue = async (actionToRemove) => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    let queue = existing ? JSON.parse(existing) : [];
    queue = queue.filter(
      (action) => action.timestamp !== actionToRemove.timestamp
    );
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to remove from queue", e);
  }
};
