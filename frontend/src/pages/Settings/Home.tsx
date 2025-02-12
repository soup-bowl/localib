import {
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonAlert,
	IonButton,
	IonCol,
	IonGrid,
	IonItem,
	IonLabel,
	IonList,
	IonNote,
	IonRow,
	IonToggle,
	IonSelectOption,
	IonSelect,
	getConfig,
} from "@ionic/react"
import { useHistory } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useAuth, useSettings } from "@/hooks"
import { DonateButton, InfoBanners } from "@/components"
import { DeviceMode } from "@/types"
import { getStartToken } from "@/api"

const SettingsHomePage: React.FC<{ hasUpdate: boolean; onUpdate: () => void }> = ({ hasUpdate, onUpdate }) => {
	const queryClient = useQueryClient()
	const history = useHistory()
	const [{ username }, _, clearAuth] = useAuth()
	const [imageQuality, setImageQuality] = useSettings<boolean>("ImagesAreHQ", false)
	const [deviceTheme, setDeviceTheme] = useSettings<DeviceMode>("DeviceTheme", "ios")
	const [__, setOauthSecretLogin] = useSettings<string>("Callink", "")
	const [restartAlert, setRestartAlert] = useState<boolean>(false)
	const appVersion = import.meta.env.VITE_VER ?? "Unknown"
	const ionConfig = getConfig()
	const currentMode = ionConfig?.get("mode") || "ios"

	const deleteData = () => {
		queryClient.clear()
		clearAuth()
		history.push("/")
		window.location.reload()
	}

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
						<IonItem id="present-alert" color={lightMode} button>
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
					<IonItem color={lightMode} button routerLink="/settings/stats">
						<IonLabel>Information</IonLabel>
					</IonItem>
				</IonList>

				<IonGrid>
					<IonRow class="ion-justify-content-center">
						<IonCol size="auto">
							<IonButton onClick={() => window.location.reload()} color="primary">
								Reload app
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>
				<IonAlert
					header="Do you want to log out?"
					trigger="present-alert"
					buttons={[
						{
							text: "Cancel",
							role: "cancel",
						},
						{
							text: "Confirm",
							role: "confirm",
							handler: deleteData,
						},
					]}
				/>
				<IonAlert
					isOpen={restartAlert}
					onDidDismiss={() => setRestartAlert(false)}
					header="Reload required"
					message="For these changes to take effect, you will need to reload the app."
					buttons={["OK"]}
				/>
				<IonNote color="medium" class="ion-margin-horizontal" style={{ display: "block", textAlign: "center" }}>
					Made by <a href="https://subo.dev">soup-bowl</a> and{" "}
					<a href="https://github.com/soup-bowl/Localib">open source</a>.
				</IonNote>
				<DonateButton style={{ marginTop: 20, display: "block", textAlign: "center" }} />
			</IonContent>
		</IonPage>
	)
}

export default SettingsHomePage
