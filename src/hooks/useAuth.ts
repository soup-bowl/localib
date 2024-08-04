import { useState } from "react"

// Helper function to get data from localStorage
const getLocalStorageItem = (key: string): string | null => {
	const item = localStorage.getItem(key)
	return item ? JSON.parse(item) : null
}

// Helper function to set data to localStorage
const setLocalStorageItem = (key: string, value: string): void => {
	localStorage.setItem(key, JSON.stringify(value))
}

interface AuthData {
	username: string | null
	token: string | null
}

const useAuth = (): [AuthData, (username: string, token: string) => void, () => void] => {
	// Initialize state with values from localStorage
	const [auth, setAuth] = useState<AuthData>({
		username: getLocalStorageItem("username"),
		token: getLocalStorageItem("token"),
	})

	// Function to update username and token in state and localStorage
	const saveAuth = (username: string, token: string): void => {
		setLocalStorageItem("username", username)
		setLocalStorageItem("token", token)
		setAuth({ username, token })
	}

	// Function to clear username and token from state and localStorage
	const clearAuth = (): void => {
		localStorage.removeItem("username")
		localStorage.removeItem("token")
		setAuth({ username: null, token: null })
	}

	return [auth, saveAuth, clearAuth]
}

export default useAuth
