/**
 * Storage adapter for Zustand persist middleware.
 * Uses AsyncStorage (compatible with Expo Go).
 * Can be swapped to MMKV in a development build for better performance.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * Zustand-compatible storage using AsyncStorage
 */
export const mmkvStorage: StateStorage = {
  getItem: async (name: string) => {
    const value = await AsyncStorage.getItem(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};
