// UserContext.tsx
import React, { createContext, useState, ReactNode, useEffect, FC } from "react"

interface UserContextProps {
	username: string
	setUsername: React.Dispatch<React.SetStateAction<string>>
	password: string
	setPassword: React.Dispatch<React.SetStateAction<string>>
}

const UserContext = createContext<UserContextProps | undefined>(undefined)

interface UserProviderProps {
	children: ReactNode
}

const UserProvider: FC<UserProviderProps> = ({ children }) => {
	const [username, setUsername] = useState<string>(() => {
		return localStorage.getItem("DISCOGS_USER") || ""
	})

	const [password, setPassword] = useState<string>(() => {
		return localStorage.getItem("DISCOGS_TOKEN") || ""
	})

	useEffect(() => {
		localStorage.setItem("DISCOGS_USER", username)
	}, [username])

	useEffect(() => {
		localStorage.setItem("DISCOGS_TOKEN", password)
	}, [password])

	return (
		<UserContext.Provider value={{ username, setUsername, password, setPassword }}>{children}</UserContext.Provider>
	)
}

export { UserContext, UserProvider }
