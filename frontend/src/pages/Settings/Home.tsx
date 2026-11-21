import {
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonAlert,
	IonButton,
	IonItem,
	IonLabel,
	IonList,
	IonNote,
	IonToggle,
	IonSelectOption,
	IonSelect,
	IonAvatar,
} from "@ionic/react"
import { useState } from "react"
import { useAuth, useDeviceTheme, useSettings } from "@/hooks"
import { InfoBanners, ThemeItemGroup } from "@/components"
import { DeviceMode } from "@/types"
import { getProfile, getStartToken, IProfile } from "@/api"
import { useQuery } from "@tanstack/react-query"

const SettingsHomePage: React.FC<{ hasUpdate: boolean; onUpdate: () => void }> = ({ hasUpdate, onUpdate }) => {
	const [{ username, accessToken, secretToken }] = useAuth()
	const [imageQuality, setImageQuality] = useSettings<boolean>("ImagesAreHQ", false)
	const [deviceTheme, setDeviceTheme] = useSettings<DeviceMode>("DeviceTheme", "ios")
	const [, setOauthSecretLogin] = useSettings<string>("Callink", "")
	const [restartAlert, setRestartAlert] = useState<boolean>(false)
	const appVersion = import.meta.env.VITE_VER ?? "Unknown"
	const { isIos26, itemColor: lightMode } = useDeviceTheme()

	// Tokens are deliberately left out of the query key - they don't change what data is returned.
	// eslint-disable-next-line @tanstack/query/exhaustive-deps
	const { data } = useQuery<IProfile>({
		queryKey: [`${username}profile`],
		queryFn: () => getProfile(username ?? "", accessToken ?? "", secretToken ?? ""),
		staleTime: Infinity,
		enabled: Boolean(username && accessToken && secretToken),
	})

	return (
		<IonPage>
			<IonHeader translucent={isIos26}>
				<IonToolbar>
					<IonTitle>Settings</IonTitle>
				</IonToolbar>
				<InfoBanners />
			</IonHeader>
			<IonContent className="ion-padding" fullscreen={isIos26}>
				<IonList inset={true}>
					<ThemeItemGroup>
						{username ? (
							<IonItem color={lightMode} button routerLink="/settings/profile">
								{data?.avatar_base64 && (
									<IonAvatar aria-hidden="true" slot="start">
										<img alt="" src={data?.avatar_base64} />
									</IonAvatar>
								)}
								<IonLabel>
									<h2>{username}</h2>
									<p>Discogs Account</p>
								</IonLabel>
							</IonItem>
						) : (
							<IonItem
								color={lightMode}
								button
								onClick={async () => {
									try {
										const callink = await getStartToken()
										setOauthSecretLogin(callink.tokenSecret)
										window.location.href = callink.redirectUrl
									} catch (error) {
										setOauthSecretLogin("")
										console.error(error)
									}
								}}
							>
								<IonLabel>Login to Discogs</IonLabel>
							</IonItem>
						)}
					</ThemeItemGroup>
				</IonList>
				<IonList inset={true}>
					<ThemeItemGroup>
						<IonItem color={lightMode}>
							<IonToggle checked={imageQuality} onIonChange={(e) => setImageQuality(e.detail.checked)}>
								Increase image quality
							</IonToggle>
						</IonItem>
					</ThemeItemGroup>
				</IonList>
				<IonNote color="medium" className="ion-margin-horizontal" style={{ display: "block" }}>
					If you have a large library, you may experience issues with this.
				</IonNote>
				<IonList inset={true}>
					<ThemeItemGroup>
						<IonItem color={lightMode}>
							<IonSelect
								label="Theme mode"
								interface="action-sheet"
								value={deviceTheme}
								onIonChange={(e) => {
									setDeviceTheme(e.detail.value)
									setRestartAlert(true)
								}}
							>
								<IonSelectOption value="ios">Apple</IonSelectOption>
								<IonSelectOption value="ios26">Apple (beta)</IonSelectOption>
								<IonSelectOption value="md">Android (beta)</IonSelectOption>
							</IonSelect>
						</IonItem>
					</ThemeItemGroup>
				</IonList>
				<IonList inset={true}>
					<ThemeItemGroup>
						<IonItem color={lightMode}>
							<IonLabel>App version</IonLabel>
							<IonLabel slot="end">
								{appVersion}
								{hasUpdate && (
									<IonButton
										onClick={onUpdate}
										color="primary"
										size="small"
										style={{ marginLeft: "10px" }}
									>
										Update
									</IonButton>
								)}
							</IonLabel>
						</IonItem>
						<IonItem color={lightMode} button routerLink="/settings/info">
							<IonLabel>Information</IonLabel>
						</IonItem>
						<IonItem
							color={lightMode}
							button
							detail={false}
							href="https://www.buymeacoffee.com/soupbowl"
							target="_blank"
						>
							<IonLabel>Donate</IonLabel>
						</IonItem>
					</ThemeItemGroup>
				</IonList>

				<IonAlert
					isOpen={restartAlert}
					onDidDismiss={() => setRestartAlert(false)}
					header="Reload required"
					message="For these changes to take effect, you will need to reload the app."
					buttons={["OK"]}
				/>
			</IonContent>
		</IonPage>
	)
}

export default SettingsHomePage
