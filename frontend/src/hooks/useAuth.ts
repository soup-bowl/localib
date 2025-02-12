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
	accessToken: string | null
	secretToken: string | null
}

const useAuth = (): [AuthData, (username: string, accessToken: string, secretToken: string) => void, () => void] => {
	// Initialize state with values from localStorage
	const [auth, setAuth] = useState<AuthData>({
		username: getLocalStorageItem("username"),
		accessToken: getLocalStorageItem("accessToken"),
		secretToken: getLocalStorageItem("secretToken"),
	})

	// Function to update username and token in state and localStorage
	const saveAuth = (username: string, accessToken: string, secretToken: string): void => {
		setLocalStorageItem("username", username)
		setLocalStorageItem("accessToken", accessToken)
		setLocalStorageItem("secretToken", secretToken)

		setAuth({ username, accessToken, secretToken })
	}

	// Function to clear username and token from state and localStorage
	const clearAuth = (): void => {
		localStorage.removeItem("username")
		localStorage.removeItem("accessToken")
		localStorage.removeItem("secretToken")
		setAuth({ username: null, accessToken: null, secretToken: null })
	}

	return [auth, saveAuth, clearAuth]
}

export default useAuth
