import {
	IonModal,
	IonHeader,
	IonToolbar,
	IonButtons,
	IonButton,
	IonTitle,
	IonContent,
	IonAvatar,
	IonCard,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
} from "@ionic/react"
import { useQuery } from "@tanstack/react-query"
import { hourglass, library, eye } from "ionicons/icons"
import { IProfile, getProfile } from "@/api"
import { useAuth } from "@/hooks"
import { FullpageInfo, FullpageLoading, StatDisplay } from "@/components"
import "./Profile.css"

const ProfileContent: React.FC = () => {
	const [{ username, token, token2 }] = useAuth()

	const { data, isLoading, isError } = useQuery<IProfile>({
		queryKey: [`${username}profile`],
		queryFn: () => getProfile(username ?? "", token ?? "", token2 ?? ""),
		staleTime: Infinity,
	})

	if (!username || isError) {
		return <FullpageInfo text="An error occurred when loading information." />
	}

	if (isLoading) {
		return <FullpageLoading />
	}

	const yearJoined = new Date(data?.registered ?? 0).getFullYear()

	return (
		<IonContent className="ion-padding">
			<div className="avatar-background" style={{ backgroundImage: `url(${data?.banner_url})` }}>
				<div className="profile-column">
					<IonAvatar>
						<img
							src={data?.avatar_url ?? "/album-placeholder.png"}
							onError={(e) => ((e.target as HTMLImageElement).src = "/album-placeholder.png")}
							alt=""
						/>
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
	)
}

const ProfileModal: React.FC<{
	open: boolean
	onClose: () => void
}> = ({ open, onClose }) => (
	<IonModal isOpen={open} onDidDismiss={() => onClose()}>
		<IonHeader>
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton onClick={() => onClose()}>Close</IonButton>
				</IonButtons>
				<IonTitle>Profile</IonTitle>
			</IonToolbar>
		</IonHeader>
		<ProfileContent />
	</IonModal>
)

export default ProfileModal
