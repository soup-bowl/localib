import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react"
import ExploreContainer from "../components/ExploreContainer"
import { getProfile, IProfile } from "../api"
import { useQuery } from "@tanstack/react-query"

const ProfilePage: React.FC = () => {
	const query = useQuery<IProfile>({
		queryKey: ["todos"],
		queryFn: getProfile,
	})

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Profile</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Proofile</IonTitle>
					</IonToolbar>
				</IonHeader>
				<ExploreContainer name="Profile" />
			</IonContent>
		</IonPage>
	)
}

export default ProfilePage
