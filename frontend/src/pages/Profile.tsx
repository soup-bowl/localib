import { useState } from "react"
import {
	IonAvatar,
	IonButton,
	IonCard,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonToolbar,
} from "@ionic/react"
import { useQuery } from "@tanstack/react-query"
import { cogOutline, eye, hourglass, library } from "ionicons/icons"
import { FullpageInfo, FullpageLoading, StatDisplay } from "../components"
import { getProfile, IProfile } from "../api"
import { Settings } from "../modal"
import { useAuth } from "../hooks"
import "./Profile.css"

const ProfilePage: React.FC = () => {
	const [openSettingsDialog, setOpenSettingsDialog] = useState<boolean>(false)

	const [{ username, token }, saveAuth, clearAuth] = useAuth()

	const { data, isLoading, isError } = useQuery<IProfile>({
		queryKey: [`${username}profile`],
		queryFn: () => getProfile(username ?? "", token ?? ""),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	if (!username || isError) {
		return (
			<IonPage>
				<IonContent fullscreen>
					<IonHeader translucent>
						<IonToolbar>
							<IonButton fill="clear" size="large" slot="end" onClick={() => setOpenSettingsDialog(true)}>
								<IonIcon icon={cogOutline}></IonIcon>
							</IonButton>
						</IonToolbar>
					</IonHeader>
					<FullpageInfo
						text={isError ? "An error occurred when loading information." : "You are not logged in."}
					/>
				</IonContent>

				<Settings
					open={openSettingsDialog}
					onClose={() => setOpenSettingsDialog(false)}
					onSave={() => setOpenSettingsDialog(false)}
				/>
			</IonPage>
		)
	}

	if (isLoading) {
		return (
			<IonPage>
				<FullpageLoading />
			</IonPage>
		)
	}

	const yearJoined = new Date(data?.registered ?? 0).getFullYear()

	return (
		<IonPage>
			<IonContent fullscreen>
				<div className="avatar-background" style={{ backgroundImage: `url(${data?.banner_url})` }}>
					<IonHeader translucent>
						<IonToolbar>
							<IonButton fill="clear" size="large" slot="end" onClick={() => setOpenSettingsDialog(true)}>
								<IonIcon icon={cogOutline}></IonIcon>
							</IonButton>
						</IonToolbar>
					</IonHeader>
					<div className="profile-column">
						<IonAvatar>
							<img src={data?.avatar_url} />
						</IonAvatar>
					</div>
					<IonCard style={{ textAlign: "center", marginBottom: 50 }}>
						<IonCardHeader>
							<IonCardTitle>{data?.username}</IonCardTitle>
							<IonCardSubtitle>{data?.name}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
					<br />
				</div>
				<div>
					<StatDisplay
						items={[
							{ icon: hourglass, value: yearJoined, label: "Registered" },
							{ icon: library, value: data?.num_collection, label: "Collected" },
							{ icon: eye, value: data?.num_wantlist, label: "Wanted" },
						]}
					/>
				</div>
			</IonContent>

			<Settings
				open={openSettingsDialog}
				onClose={() => setOpenSettingsDialog(false)}
				onSave={() => setOpenSettingsDialog(false)}
			/>
		</IonPage>
	)
}

export default ProfilePage
