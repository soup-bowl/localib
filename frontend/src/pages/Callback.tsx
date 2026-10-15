import { getAccessToken, getMe } from "@/api"
import { FullpageLoading } from "@/components"
import { useAuth, useSettings } from "@/hooks"
import { IonPage } from "@ionic/react"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const CallbackLoginPage: React.FC = () => {
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const [oauthSecretLogin, setOauthSecretLogin] = useSettings<string | undefined>("Callink", undefined)
	const [_, saveAuth] = useAuth()

	const oauthToken = searchParams.get("oauth_token")
	const oauthVerifier = searchParams.get("oauth_verifier")
	const wasDenied = searchParams.get("denied")

	useEffect(() => {
		const authorizeUser = async () => {
			if (wasDenied) {
				setOauthSecretLogin("")
				navigate("/")
				return
			}

			if (oauthToken && oauthVerifier && oauthSecretLogin) {
				try {
					const response = await getAccessToken({
						oauthToken: oauthToken,
						oauthSecret: oauthSecretLogin,
						oauthVerifier: oauthVerifier,
					})
					const whoami = await getMe(response.accessToken, response.secretToken)

					saveAuth(whoami.username, response.accessToken, response.secretToken)
					setOauthSecretLogin("")
					queryClient.clear()
					navigate("/")
					window.location.reload()
				} catch (error) {
					console.error(error)
					setOauthSecretLogin("")
					navigate("/")
				}
			}
		}
		authorizeUser()
	}, [oauthToken, oauthVerifier, oauthSecretLogin])

	return (
		<IonPage>
			<FullpageLoading />
		</IonPage>
	)
}

export default CallbackLoginPage
