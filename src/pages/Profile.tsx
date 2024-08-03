import { IonAvatar, IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react"
import { FullpageLoading, StatDisplay } from "../components"
import { getProfile, IProfile } from "../api"
import { useQuery } from "@tanstack/react-query"
import { cogOutline, eye, happy, hourglass, library, statsChart, thumbsUp } from "ionicons/icons"
import "./Profile.css"

const ProfilePage: React.FC = () => {
	const { data, isLoading } = useQuery<IProfile>({
		queryKey: ["profile"],
		queryFn: getProfile,
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
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

	const yearJoined = new Date(data?.registered ?? 0).getFullYear()

	return (
		<IonPage>
			<IonContent fullscreen>
				<div className="avatarBackground" style={{ backgroundImage: `url(${data?.banner_url})` }}>
					<IonHeader translucent>
						<IonToolbar>
							<IonButton fill="clear" size="large" slot="end">
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
		</IonPage>
	)
}

export default ProfilePage
