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
} from "@ionic/react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../hooks"
import { formatBytes } from "../utils"
import packageJson from "../../package.json"

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
		queryClient.invalidateQueries()
		onSave()
	}

	const handleUpdate = () => {
		if (window.location.reload) {
			window.location.reload()
		}
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
					token, or click Generate if you do not have one.ssss
				</IonNote>
				<IonList inset={true}>
					<IonItem>
						<IonLabel>App Version</IonLabel>
						<IonLabel slot="end">
							{packageJson.version}
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
						<IonLabel>Storage Used</IonLabel>
						<IonLabel slot="end">
							{storageInfo?.usage ?? "Unknown"} of {storageInfo?.quota ?? "Unknown"}
						</IonLabel>
					</IonItem>
				</IonList>
			</IonContent>
		</IonModal>
	)
}

export default Settings
