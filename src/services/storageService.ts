// Local storage service for persisting mock data

const STORAGE_PREFIX = 'rematter_'

export const storageService = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
      return item ? JSON.parse(item) : null
    } catch {
      console.error(`Error reading from localStorage: ${key}`)
      return null
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
    } catch {
      console.error(`Error writing to localStorage: ${key}`)
    }
  },

  remove(key: string): void {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  },

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key))
  },
}
