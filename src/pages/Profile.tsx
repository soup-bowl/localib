import { IonAvatar, IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react"
import { ExploreContainer, FullpageLoading } from "../components"
import { getProfile, IProfile } from "../api"
import { useQuery } from "@tanstack/react-query"
import { cogOutline } from "ionicons/icons"
import "./Profile.css"

const ProfilePage: React.FC = () => {
	const { data, isLoading } = useQuery<IProfile>({
		queryKey: ["profile"],
		queryFn: getProfile,
	})

	if (data) {
		console.log("aaa", data)
	}

	if (isLoading) {
		return (
			<IonPage>
				<FullpageLoading />
			</IonPage>
		)
	}

	return (
		<IonPage>
			<IonContent fullscreen>
				<div className="avatarBackground" style={{ backgroundImage: `url(${data?.banner_url})` }}>
					<IonHeader collapse="condense" translucent>
						<IonToolbar>
							<IonTitle size="large">{data?.name}</IonTitle>
							<IonButton fill="clear" size="large" slot="end">
								<IonIcon icon={cogOutline}></IonIcon>
							</IonButton>
						</IonToolbar>
					</IonHeader>
					<div className="profileColumn">
						<IonAvatar>
							<img src={data?.avatar_url} />
						</IonAvatar>
						<p>ssss</p>
					</div>
				</div>

				<ExploreContainer name="Profile" />
			</IonContent>
		</IonPage>
	)
}

export default ProfilePage
