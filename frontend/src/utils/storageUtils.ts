/**
 * Storage persistence utilities for PWA
 * Handles requesting and checking persistent storage on iOS and Android
 */

export interface StoragePersistenceStatus {
	/** Whether the browser supports the Storage API */
	supported: boolean
	/** Whether persistent storage has been granted */
	persisted: boolean
	/** Whether we can request persistence */
	canRequest: boolean
}

/**
 * Checks if persistent storage is currently granted
 */
export async function checkStoragePersistence(): Promise<StoragePersistenceStatus> {
	// Check if Storage API is supported
	if (!navigator.storage || !navigator.storage.persist) {
		return {
			supported: false,
			persisted: false,
			canRequest: false,
		}
	}

	try {
		const persisted = await navigator.storage.persisted()
		return {
			supported: true,
			persisted,
			canRequest: !persisted, // Can only request if not already persisted
		}
	} catch (error) {
		console.error("Error checking storage persistence:", error)
		return {
			supported: true,
			persisted: false,
			canRequest: false,
		}
	}
}

/**
 * Requests persistent storage permission from the browser
 * This helps prevent IndexedDB data from being cleared on mobile browsers
 *
 * @returns Promise<boolean> - true if persistence was granted
 */
export async function requestStoragePersistence(): Promise<boolean> {
	// Check if Storage API is supported
	if (!navigator.storage || !navigator.storage.persist) {
		console.warn("Storage API not supported in this browser")
		return false
	}

	try {
		// First check if already persisted
		const alreadyPersisted = await navigator.storage.persisted()
		if (alreadyPersisted) {
			console.log("Storage is already persistent")
			return true
		}

		// Request persistence
		const granted = await navigator.storage.persist()
		if (granted) {
			console.log("Persistent storage granted!")
		} else {
			console.warn(
				"Persistent storage denied. Data may be cleared after inactivity. Try adding this app to your home screen."
			)
		}
		return granted
	} catch (error) {
		console.error("Error requesting storage persistence:", error)
		return false
	}
}

/**
 * Gets a user-friendly message about storage persistence for the current browser
 */
export function getStoragePersistenceMessage(status: StoragePersistenceStatus): string {
	if (!status.supported) {
		return "Your browser doesn't support persistent storage. Data may be cleared after a period of inactivity. Adding this app to your home screen may improve data retention, but cannot guarantee persistence."
	}

	if (status.persisted) {
		return "Your data is protected and won't be automatically cleared by the browser."
	}

	return "To prevent your collection data from being cleared, add this app to your home screen or grant storage permissions when prompted."
}
