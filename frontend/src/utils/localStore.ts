/**
 * Tiny localStorage-backed store that notifies subscribers when a key changes, so every component reading
 * the same key stays in sync (within this tab via our own events, across tabs via the "storage" event).
 */
type Listener = () => void

const listeners = new Set<Listener>()

const notify = () => listeners.forEach((listener) => listener())

export const subscribeToStore = (listener: Listener): (() => void) => {
	listeners.add(listener)
	window.addEventListener("storage", listener)
	return () => {
		listeners.delete(listener)
		window.removeEventListener("storage", listener)
	}
}

export const readRaw = (key: string): string | null => localStorage.getItem(key)

export const parseStored = <T>(raw: string | null): T | null => {
	if (!raw) return null
	try {
		return JSON.parse(raw) as T
	} catch {
		return null
	}
}

export const writeStored = <T>(key: string, value: T): void => {
	localStorage.setItem(key, JSON.stringify(value))
	notify()
}

export const removeStored = (...keys: string[]): void => {
	keys.forEach((key) => localStorage.removeItem(key))
	notify()
}
