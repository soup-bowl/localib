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
	getConfig,
} from "@ionic/react"
import { useState } from "react"
import { useAuth, useSettings } from "@/hooks"
import { InfoBanners } from "@/components"
import { DeviceMode } from "@/types"
import { getStartToken } from "@/api"

const SettingsHomePage: React.FC<{ hasUpdate: boolean; onUpdate: () => void }> = ({ hasUpdate, onUpdate }) => {
	const [{ username }] = useAuth()
	const [imageQuality, setImageQuality] = useSettings<boolean>("ImagesAreHQ", false)
	const [deviceTheme, setDeviceTheme] = useSettings<DeviceMode>("DeviceTheme", "ios")
	const [__, setOauthSecretLogin] = useSettings<string>("Callink", "")
	const [restartAlert, setRestartAlert] = useState<boolean>(false)
	const appVersion = import.meta.env.VITE_VER ?? "Unknown"
	const ionConfig = getConfig()
	const currentMode = ionConfig?.get("mode") || "ios"

	const lightMode = currentMode === "ios" ? "light" : undefined

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Settings</IonTitle>
				</IonToolbar>
				<InfoBanners />
			</IonHeader>
			<IonContent className="ion-padding">
				<IonList inset={true}>
					{username ? (
						<IonItem color={lightMode} button routerLink="/settings/profile">
							<IonLabel>Discogs account ({username})</IonLabel>
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
				</IonList>
				<IonList inset={true}>
					<IonItem color={lightMode}>
						<IonToggle checked={imageQuality} onIonChange={(e) => setImageQuality(e.detail.checked)}>
							Increase image quality
						</IonToggle>
					</IonItem>
				</IonList>
				<IonNote color="medium" class="ion-margin-horizontal" style={{ display: "block" }}>
					If you have a large library, you may experience issues with this.
				</IonNote>
				<IonList inset={true}>
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
							<IonSelectOption value="md">Android (beta)</IonSelectOption>
						</IonSelect>
					</IonItem>
				</IonList>
				<IonList inset={true}>
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
