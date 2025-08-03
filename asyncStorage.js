import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeData = async (key, value) => {
  try {
    await AsyncStorage.setItem(
      key,
      typeof value === "object" ? JSON.stringify(value) : value
    );
  } catch (e) {
    console.log(e);
  }
};

export const getStorageData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }
  } catch (e) {
    console.log(e);
  }
};

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log(e);
    console.error(`Error removing data for key ${key}:`, e);
  }
};
