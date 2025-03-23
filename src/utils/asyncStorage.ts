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
    // Convert value to string if it's not already
    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (Capacitor.isNativePlatform()) {
      // On native platforms, use Capacitor Preferences
      await Preferences.set({ key, value: valueToStore });
    } else {
      // In web, fall back to localStorage
      localStorage.setItem(key, valueToStore);
    }
    
    return true;
  } catch (error) {
    console.error(`[AsyncStorage] Error storing data for key ${key}:`, error);
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
    let value: string | null = null;
    
    if (Capacitor.isNativePlatform()) {
      // On native platforms, use Capacitor Preferences
      const result = await Preferences.get({ key });
      value = result.value;
    } else {
      // In web, fall back to localStorage
      value = localStorage.getItem(key);
    }
    
    if (value === null) {
      return null;
    }
    
    // Try to parse the value as JSON, if it fails return the raw value
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error(`[AsyncStorage] Error retrieving data for key ${key}:`, error);
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
      // On native platforms, use Capacitor Preferences
      await Preferences.remove({ key });
    } else {
      // In web, fall back to localStorage
      localStorage.removeItem(key);
    }
    
    return true;
  } catch (error) {
    console.error(`[AsyncStorage] Error removing data for key ${key}:`, error);
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
      // On native platforms, use Capacitor Preferences
      await Preferences.clear();
    } else {
      // In web, fall back to localStorage
      localStorage.clear();
    }
    
    return true;
  } catch (error) {
    console.error('[AsyncStorage] Error clearing storage:', error);
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
      // On native platforms, use Capacitor Preferences
      const { keys } = await Preferences.keys();
      return keys;
    } else {
      // In web, fall back to localStorage
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    }
  } catch (error) {
    console.error('[AsyncStorage] Error getting all keys:', error);
    return [];
  }
};