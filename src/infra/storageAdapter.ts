type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const isBrowser = (): boolean => typeof window !== "undefined";

const createLocalStorageAdapter = (): StorageAdapter => {
  return {
    getItem: (key) => {
      if (!isBrowser()) {
        return null;
      }

      return window.localStorage.getItem(key);
    },
    setItem: (key, value) => {
      if (!isBrowser()) {
        return;
      }

      window.localStorage.setItem(key, value);
    },
    removeItem: (key) => {
      if (!isBrowser()) {
        return;
      }

      window.localStorage.removeItem(key);
    },
  };
};

const storageAdapter = createLocalStorageAdapter();

export type { StorageAdapter };
export { createLocalStorageAdapter, storageAdapter };
