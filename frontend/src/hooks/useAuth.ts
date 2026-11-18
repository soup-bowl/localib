import { useCallback } from "react"
import { removeStored, writeStored } from "@/utils/localStore"
import useSettings from "./useSettings"

interface AuthData {
	username: string | null
	accessToken: string | null
	secretToken: string | null
}

const useAuth = (): [AuthData, (username: string, accessToken: string, secretToken: string) => void, () => void] => {
	const [username] = useSettings<string | null>("username", null)
	const [accessToken] = useSettings<string | null>("accessToken", null)
	const [secretToken] = useSettings<string | null>("secretToken", null)

	const saveAuth = useCallback((username: string, accessToken: string, secretToken: string): void => {
		writeStored("username", username)
		writeStored("accessToken", accessToken)
		writeStored("secretToken", secretToken)
	}, [])

	const clearAuth = useCallback((): void => removeStored("username", "accessToken", "secretToken"), [])

	return [{ username, accessToken, secretToken }, saveAuth, clearAuth]
}

export default useAuth
