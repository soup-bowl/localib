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
} from "@ionic/react"
import { useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { IReleaseSet } from "../api"
import { useAuth, useSettings } from "../hooks"
import { formatBytes } from "../utils"
import { useHistory } from "react-router"

const SettingsPage: React.FC<{ hasUpdate: boolean }> = ({ hasUpdate }) => {
	const betaBanner = import.meta.env.VITE_BETA_BANNER

	const queryClient = useQueryClient()
	const history = useHistory()
	const [{ username, token }, saveAuth, clearAuth] = useAuth()
	const [newUsername, setNewUsername] = useState<string>(username ?? "")
	const [newPassword, setNewPassword] = useState<string>(token ?? "")
	const [storageInfo, setStorageInfo] = useState<{ usage: string; quota: string } | undefined>()
	const [imageQuality, setImageQuality, clearImagequality] = useSettings<boolean>("ImagesAreHQ", false)
	const appVersion = import.meta.env.VITE_VER ?? "Unknown"

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

	const handleUpdate = () => {
		if (window.location.reload) {
			window.location.reload()
		}
	}

	const deleteData = () => {
		queryClient.clear()
		clearAuth()
		clearImagequality()
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
				{betaBanner && (
					<IonToolbar className="beta-banner" color="warning">
						<IonTitle>{betaBanner}</IonTitle>
					</IonToolbar>
				)}
			</IonHeader>
			<IonContent className="ion-padding">
				<IonList inset={true}>
					<IonItem color="light">
						<IonInput
							label="Username"
							value={newUsername}
							onIonChange={(e) => setNewUsername(`${e.target.value}`)}
						/>
					</IonItem>
					<IonItem color="light">
						<IonInput
							type="password"
							label="Token"
							value={newPassword}
							onIonChange={(e) => setNewPassword(`${e.target.value}`)}
						>
							<IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
						</IonInput>
					</IonItem>
				</IonList>
				<IonNote color="medium" class="ion-margin-horizontal" style={{ display: "block" }}>
					Until OAuth is implemented, we currently use Access Token for authentication. To get your token,{" "}
					<a href="https://www.discogs.com/settings/developers">visit the Developer page</a> and copy your
					token, or click Generate if you do not have one.
				</IonNote>
				<IonList inset={true}>
					<IonItem color="light">
						<IonToggle checked={imageQuality} onIonChange={(e) => setImageQuality(e.detail.checked)}>
							Increase image quality
						</IonToggle>
					</IonItem>
				</IonList>
				<IonNote color="medium" class="ion-margin-horizontal" style={{ display: "block" }}>
					If you have a large library, you may experience issues with this.
				</IonNote>
				<IonList inset={true}>
					<IonItem color="light">
						<IonLabel>App version</IonLabel>
						<IonLabel slot="end">
							{appVersion}
							{hasUpdate && (
								<IonButton
									onClick={handleUpdate}
									color="primary"
									size="small"
									style={{ marginLeft: "10px" }}
								>
									Update
								</IonButton>
							)}
						</IonLabel>
					</IonItem>
					<IonItem color="light">
						<IonLabel>Storage used</IonLabel>
						<IonLabel slot="end">
							{storageInfo?.usage ?? "Unknown"} of {storageInfo?.quota ?? "Unknown"}
						</IonLabel>
					</IonItem>
					<IonItem color="light">
						<IonLabel>Records stored</IonLabel>
						<IonLabel id="reccount-tooltip" slot="end">
							{inStorageInfo.totalCount}
						</IonLabel>
					</IonItem>
					<IonItem color="light">
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
							<IonButton onClick={handleUpdate} color="primary">
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
				<br />
				<IonNote color="medium" class="ion-margin-horizontal" style={{ display: "block", textAlign: "center" }}>
					Made by <a href="https://subo.dev">soup-bowl</a> and{" "}
					<a href="https://github.com/soup-bowl/Localib">open source</a>.
				</IonNote>
			</IonContent>
		</IonPage>
	)
}

export default SettingsPage
