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
	IonInput,
	IonInputPasswordToggle,
	IonItem,
	IonLabel,
	IonList,
	IonNote,
	IonPopover,
	IonRow,
	IonToggle,
	IonButtons,
	IonSelectOption,
	IonSelect,
	getConfig,
} from "@ionic/react"
import { useHistory } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { IReleaseSet } from "@/api"
import { useAuth, useSettings } from "@/hooks"
import { formatBytes } from "@/utils"
import { DonateButton, InfoBanners } from "@/components"
import { DeviceMode } from "@/types"

const SettingsPage: React.FC<{ hasUpdate: boolean; onUpdate: () => void }> = ({ hasUpdate, onUpdate }) => {
	const queryClient = useQueryClient()
	const history = useHistory()
	const [{ username, token }, saveAuth, clearAuth] = useAuth()
	const [newUsername, setNewUsername] = useState<string>(username ?? "")
	const [newPassword, setNewPassword] = useState<string>(token ?? "")
	const [storageInfo, setStorageInfo] = useState<{ usage: string; quota: string } | undefined>()
	const [imageQuality, setImageQuality, clearImagequality] = useSettings<boolean>("ImagesAreHQ", false)
	const [deviceTheme, setDeviceTheme] = useSettings<DeviceMode>("DeviceTheme", "ios")
	const appVersion = import.meta.env.VITE_VER ?? "Unknown"
	const ionConfig = getConfig()
	const currentMode = ionConfig?.get("mode") || "ios"

	useEffect(() => {
		if ("storage" in navigator && "estimate" in navigator.storage) {
			navigator.storage.estimate().then(({ usage, quota }) => {
				if (usage && quota) {
					setStorageInfo({ usage: formatBytes(usage), quota: formatBytes(quota) })
				}
			})
		}
	}, [])

	const handleSave = () => {
		saveAuth(newUsername, newPassword)
		queryClient.clear()
		history.push("/")
		window.location.reload()
	}

	const deleteData = () => {
		queryClient.clear()
		clearAuth()
		clearImagequality()
		history.push("/")
		window.location.reload()
	}

	const collection = queryClient.getQueryData<IReleaseSet>([`${username}collectionv2`])
	const collectionMissing = collection?.collection.filter((obj) => obj.image_base64 === undefined).length ?? 0
	const wantedMissing = collection?.wants.filter((obj) => obj.image_base64 === undefined).length ?? 0

	const inStorageInfo = {
		collectionCount: collection?.collection.length ?? 0,
		collectionMissing: collectionMissing,
		wantedCount: collection?.wants.length ?? 0,
		wantedMissing: wantedMissing,
		totalCount: (collection?.collection.length ?? 0) + (collection?.wants.length ?? 0),
		totalMissing: collectionMissing + wantedMissing,
	}

	const lightMode = currentMode === "ios" ? "light" : undefined

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Settings</IonTitle>
					<IonButtons slot="end">
						<IonButton strong={true} onClick={handleSave}>
							Save
						</IonButton>
					</IonButtons>
				</IonToolbar>
				<InfoBanners />
			</IonHeader>
			<IonContent className="ion-padding">
				<IonList inset={true}>
					<IonItem color={lightMode}>
						<IonInput
							label="Username"
							value={newUsername}
							onIonChange={(e) => setNewUsername(`${e.target.value}`)}
						/>
					</IonItem>
					<IonItem color={lightMode}>
						<IonInput
							type="password"
							label="Token"
							value={newPassword}
							onIonChange={(e) => setNewPassword(`${e.target.value}`)}
						>
							<IonInputPasswordToggle slot="end" />
						</IonInput>
					</IonItem>
				</IonList>
				<IonNote color="medium" class="ion-margin-horizontal" style={{ display: "block" }}>
					Until OAuth is implemented, we currently use Access Token for authentication. To get your token,{" "}
					<a href="https://www.discogs.com/settings/developers">visit the Developer page</a> and copy your
					token, or click Generate if you do not have one.
				</IonNote>
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
							id="changed-theme"
							label="Theme mode"
							interface="action-sheet"
							value={deviceTheme}
							onIonChange={(e) => setDeviceTheme(e.detail.value)}
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
					<IonItem color={lightMode}>
						<IonLabel>Storage used</IonLabel>
						<IonLabel slot="end">
							{storageInfo?.usage ?? "Unknown"} of {storageInfo?.quota ?? "Unknown"}
						</IonLabel>
					</IonItem>
					<IonItem color={lightMode}>
						<IonLabel>Records stored</IonLabel>
						<IonLabel id="reccount-tooltip" slot="end">
							{inStorageInfo.totalCount}
						</IonLabel>
					</IonItem>
					<IonItem color={lightMode}>
						<IonLabel>Records unsynced</IonLabel>
						<IonLabel id="missing-tooltip" slot="end">
							{inStorageInfo.totalMissing}
						</IonLabel>
					</IonItem>
				</IonList>
				<IonPopover trigger="reccount-tooltip" triggerAction="click">
					<IonContent class="ion-padding">
						{inStorageInfo.collectionCount} collected, {inStorageInfo.wantedCount} wanted
					</IonContent>
				</IonPopover>
				<IonPopover trigger="missing-tooltip" triggerAction="click">
					<IonContent class="ion-padding">
						{inStorageInfo.collectionMissing} collected, {inStorageInfo.wantedMissing} wanted
					</IonContent>
				</IonPopover>
				<IonNote color="medium" class="ion-margin-horizontal" style={{ display: "block" }}>
					For some records, we need to collect further information from the Discogs system. This can take some
					time, so try reloading in a few hours to see it change.
				</IonNote>
				<IonGrid>
					<IonRow class="ion-justify-content-center">
						<IonCol size="auto">
							<IonButton onClick={() => window.location.reload()} color="primary">
								Reload app
							</IonButton>
						</IonCol>
						<IonCol size="auto">
							<IonButton id="present-alert" color="danger">
								Remove data
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>
				<IonAlert
					header="This will remove your account and stored data. Are you sure?"
					trigger="present-alert"
					buttons={[
						{
							text: "Cancel",
							role: "cancel",
						},
						{
							text: "Delete",
							role: "confirm",
							handler: deleteData,
						},
					]}
				/>
				<IonAlert
					trigger="changed-theme"
					header="Reload required"
					message="For changes to take effect, you will need to reload the app."
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

export default SettingsPage
