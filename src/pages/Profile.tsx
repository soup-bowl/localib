import { useContext, useState } from "react"
import { IonAvatar, IonButton, IonContent, IonHeader, IonIcon, IonPage, IonToolbar } from "@ionic/react"
import { useQuery } from "@tanstack/react-query"
import { cogOutline, eye, hourglass, library } from "ionicons/icons"
import { FullpageInfo, FullpageLoading, StatDisplay } from "../components"
import { getProfile, IProfile } from "../api"
import { Settings } from "../modal"
import "./Profile.css"
import { UserContext } from "../context/UserContext"

const ProfilePage: React.FC = () => {
	const [openSettingsDialog, setOpenSettingsDialog] = useState<boolean>(false)

	const userContext = useContext(UserContext)

	if (!userContext) {
		throw new Error("useApi must be used within a UserProvider")
	}

	const { username, password } = userContext

	const { data, isLoading, isError } = useQuery<IProfile>({
		queryKey: ["profile"],
		queryFn: () => getProfile(username, password),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	if (data) {
		console.log("Profile", data)
	}

	if (!username) {
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
					<FullpageInfo text="You are not logged in." />
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

	if (isError) {
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
					<FullpageInfo text="An error occurred when loading information." />
				</IonContent>

				<Settings
					open={openSettingsDialog}
					onClose={() => setOpenSettingsDialog(false)}
					onSave={() => setOpenSettingsDialog(false)}
				/>
			</IonPage>
		)
	}

	const yearJoined = new Date(data?.registered ?? 0).getFullYear()

	return (
		<IonPage>
			<IonContent fullscreen>
				<div className="avatarBackground" style={{ backgroundImage: `url(${data?.banner_url})` }}>
					<IonHeader translucent>
						<IonToolbar>
							<IonButton fill="clear" size="large" slot="end" onClick={() => setOpenSettingsDialog(true)}>
								<IonIcon icon={cogOutline}></IonIcon>
							</IonButton>
						</IonToolbar>
					</IonHeader>
					<div className="profileColumn">
						<IonAvatar>
							<img src={data?.avatar_url} />
						</IonAvatar>
					</div>
				</div>
				<div style={{ textAlign: "center" }}>
					<h1>{data?.username}</h1>
					<p style={{}}>{data?.name}</p>
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
