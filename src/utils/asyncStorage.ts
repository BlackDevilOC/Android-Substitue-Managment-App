import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * Store data in persistent storage
 * @param key Storage key
 * @param value Value to store (will be stringified)
 * @returns Promise resolving to success status
 */
export const storeData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Preferences on native platforms
      await Preferences.set({
        key,
        value: jsonValue,
      });
    } else {
      // Fall back to localStorage on web
      localStorage.setItem(key, jsonValue);
    }
    
    console.log(`[Storage] Stored data for key: ${key}`);
    return true;
  } catch (error) {
    console.error(`[Storage] Error storing data for key ${key}:`, error);
    return false;
  }
};

/**
 * Get data from persistent storage
 * @param key Storage key
 * @returns Promise resolving to stored data or null
 */
export const getData = async (key: string) => {
  try {
    let jsonValue: string | null = null;
    
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Preferences on native platforms
      const result = await Preferences.get({ key });
      jsonValue = result.value;
    } else {
      // Fall back to localStorage on web
      jsonValue = localStorage.getItem(key);
    }
    
    if (jsonValue === null) {
      console.log(`[Storage] No data found for key: ${key}`);
      return null;
    }
    
    return JSON.parse(jsonValue);
  } catch (error) {
    console.error(`[Storage] Error retrieving data for key ${key}:`, error);
    return null;
  }
};

/**
 * Remove an item from storage
 * @param key Storage key
 * @returns Promise resolving to success status
 */
export const removeData = async (key: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Preferences on native platforms
      await Preferences.remove({ key });
    } else {
      // Fall back to localStorage on web
      localStorage.removeItem(key);
    }
    
    console.log(`[Storage] Removed data for key: ${key}`);
    return true;
  } catch (error) {
    console.error(`[Storage] Error removing data for key ${key}:`, error);
    return false;
  }
};

/**
 * Clear all storage
 * @returns Promise resolving to success status
 */
export const clearStorage = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Preferences on native platforms
      await Preferences.clear();
    } else {
      // Fall back to localStorage on web
      localStorage.clear();
    }
    
    console.log('[Storage] Storage cleared');
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing storage:', error);
    return false;
  }
};

/**
 * Get all storage keys
 * @returns Promise resolving to array of keys
 */
export const getAllKeys = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Preferences on native platforms
      const result = await Preferences.keys();
      return result.keys;
    } else {
      // Fall back to localStorage on web
      return Object.keys(localStorage);
    }
  } catch (error) {
    console.error('[Storage] Error getting all keys:', error);
    return [];
  }
};