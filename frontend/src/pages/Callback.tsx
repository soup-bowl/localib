import { getAccessToken, getMe } from "@/api"
import { FullpageLoading } from "@/components"
import { useAuth, useSettings } from "@/hooks"
import { IonPage } from "@ionic/react"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const CallbackLoginPage: React.FC = () => {
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	const location = useLocation()
	const [oauthSecretLogin, setOauthSecretLogin] = useSettings<string | undefined>("Callink", undefined)
	const [, saveAuth] = useAuth()
	// OAuth verifiers are single-use, so make sure the exchange only ever runs once (StrictMode runs effects twice).
	const started = useRef(false)

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search)
		const oauthToken = searchParams.get("oauth_token")
		const oauthVerifier = searchParams.get("oauth_verifier")

		if (started.current) return

		if (searchParams.get("denied")) {
			started.current = true
			setOauthSecretLogin("")
			navigate("/", { replace: true })
			return
		}

		if (!oauthToken || !oauthVerifier || !oauthSecretLogin) return
		started.current = true

		const authorizeUser = async () => {
			try {
				const response = await getAccessToken({
					oauthToken,
					oauthSecret: oauthSecretLogin,
					oauthVerifier,
				})
				const whoami = await getMe(response.accessToken, response.secretToken)

				saveAuth(whoami.username, response.accessToken, response.secretToken)
				setOauthSecretLogin("")
				queryClient.clear()
				// Full reload into the app so everything starts fresh with the new account.
				window.location.replace(import.meta.env.BASE_URL)
			} catch (error) {
				console.error(error)
				setOauthSecretLogin("")
				navigate("/", { replace: true })
			}
		}
		authorizeUser()
	}, [location.search, oauthSecretLogin, navigate, queryClient, saveAuth, setOauthSecretLogin])

	return (
		<IonPage>
			<FullpageLoading />
		</IonPage>
	)
}

export default CallbackLoginPage
