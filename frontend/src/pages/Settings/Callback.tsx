import { getAccessToken, getMe } from "@/api"
import { useAuth, useSettings } from "@/hooks"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useHistory, useLocation } from "react-router-dom"

const CallbackLoginPage: React.FC = () => {
	const queryClient = useQueryClient()
	const history = useHistory()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const [oauthSecretLogin] = useSettings<string | undefined>("Callink", undefined)
	const [{ username, token }, saveAuth] = useAuth()

	const oauthToken = searchParams.get("oauth_token")
	const oauthVerifier = searchParams.get("oauth_verifier")

	console.log("params", oauthToken, oauthVerifier, oauthSecretLogin)

	useEffect(() => {
		const authorizeUser = async () => {
			if (oauthToken && oauthVerifier && oauthSecretLogin) {
				const response = await getAccessToken({
					oauthToken: oauthToken,
					oauthSecret: oauthSecretLogin,
					oauthVerifier: oauthVerifier,
				})
				const whoami = await getMe(response.accessToken, response.secretToken)

				saveAuth(whoami.username, response.accessToken, response.secretToken)
				queryClient.clear()
				history.push("/")
				window.location.reload()
			}
		}
		authorizeUser()
	}, [oauthToken, oauthVerifier, oauthSecretLogin])

	return <>loading</>
}

export default CallbackLoginPage
