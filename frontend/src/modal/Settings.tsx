import { useEffect, useState } from "react"
import {
	IonModal,
	IonHeader,
	IonToolbar,
	IonButtons,
	IonButton,
	IonTitle,
	IonContent,
	IonItem,
	IonInput,
	IonNote,
	IonList,
	IonInputPasswordToggle,
	IonLabel,
	IonPopover,
	IonCol,
	IonGrid,
	IonRow,
	IonAlert,
} from "@ionic/react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../hooks"
import { formatBytes } from "../utils"
import { IReleases } from "../api"

interface Props {
	open: boolean
	hasUpdate: boolean
	onClose: () => void
	onSave: () => void
}

const Settings: React.FC<Props> = ({ open, hasUpdate, onClose, onSave }) => {
	const queryClient = useQueryClient()
	const [{ username, token }, saveAuth, clearAuth] = useAuth()
	const [newUsername, setNewUsername] = useState<string>(username ?? "")
	const [newPassword, setNewPassword] = useState<string>(token ?? "")
	const [storageInfo, setStorageInfo] = useState<{ usage: string; quota: string } | undefined>()
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
		onSave()
	}

	const handleUpdate = () => {
		if (window.location.reload) {
			window.location.reload()
		}
	}

	const deleteData = () => {
		saveAuth("", "")
		queryClient.clear()
		window.location.reload()
	}

	const collection = queryClient.getQueryData<IReleases[]>([`${username}collection`])
	const wanted = queryClient.getQueryData<IReleases[]>([`${username}want`])
	const collectionMissing = collection?.filter((obj) => obj.image_base64 === undefined).length ?? 0
	const wantedMissing = wanted?.filter((obj) => obj.image_base64 === undefined).length ?? 0

	const inStorageInfo = {
		collectionCount: collection?.length ?? 0,
		collectionMissing: collectionMissing,
		wantedCount: wanted?.length ?? 0,
		wantedMissing: wantedMissing,
		totalCount: (collection?.length ?? 0) + (wanted?.length ?? 0),
		totalMissing: collectionMissing + wantedMissing,
	}

	return (
		<IonModal isOpen={open}>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={() => onClose()}>Close</IonButton>
					</IonButtons>
					<IonTitle>Settings</IonTitle>
					<IonButtons slot="end">
						<IonButton strong={true} onClick={handleSave}>
							Save
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonList inset={true}>
					<IonItem>
						<IonInput
							label="Username"
							value={newUsername}
							onIonChange={(e) => setNewUsername(`${e.target.value}`)}
						/>
					</IonItem>
					<IonItem>
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
					<IonItem>
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
					<IonItem>
						<IonLabel>Storage used</IonLabel>
						<IonLabel slot="end">
							{storageInfo?.usage ?? "Unknown"} of {storageInfo?.quota ?? "Unknown"}
						</IonLabel>
					</IonItem>
					<IonItem>
						<IonLabel>Records stored</IonLabel>
						<IonLabel id="reccount-tooltip" slot="end">
							{inStorageInfo.totalCount}
						</IonLabel>
					</IonItem>
					<IonItem>
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
		</IonModal>
	)
}

export default Settings
