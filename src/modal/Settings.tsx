import { useContext, useState } from "react"
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
} from "@ionic/react"
import { UserContext } from "../context/UserContext"

interface Props {
	open: boolean
	onClose: () => void
	onSave: () => void
}

const Settings: React.FC<Props> = ({ open, onClose, onSave }) => {
	const userContext = useContext(UserContext);

	if (!userContext) {
		throw new Error('SettingsPanel must be used within a UserProvider');
	}

	const { username, setUsername, password, setPassword } = userContext;
	const [newUsername, setNewUsername] = useState<string>(username);
	const [newPassword, setNewPassword] = useState<string>(password);

	const handleSave = () => {
		console.log("Save", newUsername, newPassword, username, password)
		setUsername(newUsername);
		setPassword(newPassword);
		onSave()
	};

	return (
		<IonModal isOpen={open}>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={() => onClose()}>
							Close
						</IonButton>
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
				<IonItem>
					<IonInput label="Username" value={newUsername} onIonChange={(e) => setNewUsername(`${e.target.value}`)} />
				</IonItem>
				<IonItem>
					<IonInput label="Password" value={newPassword} onIonChange={(e) => setNewPassword(`${e.target.value}`)} />
				</IonItem>
			</IonContent>
		</IonModal>
	)
}

export default Settings
