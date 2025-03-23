import { Preferences } from '@capacitor/preferences';

// Store data in device storage
export const storeData = async (key: string, value: any) => {
  try {
    await Preferences.set({
      key,
      value: JSON.stringify(value)
    });
    return true;
  } catch (error) {
    console.error(`[AsyncStorage] Error storing data for key ${key}:`, error);
    return false;
  }
};

// Get data from device storage
export const getData = async (key: string) => {
  try {
    const result = await Preferences.get({ key });
    if (result.value) {
      return JSON.parse(result.value);
    }
    return null;
  } catch (error) {
    console.error(`[AsyncStorage] Error retrieving data for key ${key}:`, error);
    return null;
  }
};