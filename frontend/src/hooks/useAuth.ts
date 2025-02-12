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
	token2: string | null
}

const useAuth = (): [AuthData, (username: string, token: string, token2: string | null) => void, () => void] => {
	// Initialize state with values from localStorage
	const [auth, setAuth] = useState<AuthData>({
		username: getLocalStorageItem("username"),
		token: getLocalStorageItem("token"),
		token2: getLocalStorageItem("token2"),
	})

	// Function to update username and token in state and localStorage
	const saveAuth = (username: string, token: string, token2: string | null): void => {
		setLocalStorageItem("username", username)
		setLocalStorageItem("token", token)
		if (token2) {
			setLocalStorageItem("token2", token2)
		} else {
			localStorage.removeItem("token2")
		}
		setAuth({ username, token, token2 })
	}

	// Function to clear username and token from state and localStorage
	const clearAuth = (): void => {
		localStorage.removeItem("username")
		localStorage.removeItem("token")
		localStorage.removeItem("token2")
		setAuth({ username: null, token: null, token2: null })
	}

	return [auth, saveAuth, clearAuth]
}

export default useAuth
