import {
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonButton,
	IonInput,
	IonInputPasswordToggle,
	IonItem,
	IonList,
	IonNote,
	IonButtons,
	getConfig,
	IonBackButton,
} from "@ionic/react"
import { useHistory } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useAuth } from "@/hooks"
import { InfoBanners } from "@/components"

const SettingsLoginPage: React.FC = () => {
	const queryClient = useQueryClient()
	const history = useHistory()
	const [{ username, token }, saveAuth] = useAuth()
	const [newUsername, setNewUsername] = useState<string>(username ?? "")
	const [newPassword, setNewPassword] = useState<string>(token ?? "")
	const ionConfig = getConfig()
	const currentMode = ionConfig?.get("mode") || "ios"

	const handleSave = () => {
		saveAuth(newUsername, newPassword)
		queryClient.clear()
		history.push("/")
		window.location.reload()
	}

	const lightMode = currentMode === "ios" ? "light" : undefined

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start" collapse={true}>
						<IonBackButton />
					</IonButtons>
					<IonTitle>Login</IonTitle>
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
			</IonContent>
		</IonPage>
	)
}

export default SettingsLoginPage
