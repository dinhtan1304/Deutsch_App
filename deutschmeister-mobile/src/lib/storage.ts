/**
 * MMKV-based storage adapter for Zustand persist middleware.
 * MMKV is synchronous and 30x faster than AsyncStorage.
 */

import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

export const mmkv = new MMKV({ id: 'deutschmeister-storage' });

/**
 * Zustand-compatible storage using MMKV (synchronous read/write)
 */
export const mmkvStorage: StateStorage = {
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  removeItem: (name: string) => {
    mmkv.delete(name);
  },
};
