import { IProfile, getProfile } from "@/api"
import { FullpageInfo, FullpageLoading, InfoBanners, StatDisplay } from "@/components"
import { useAuth } from "@/hooks"
import {
	IonContent,
	IonAvatar,
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardSubtitle,
	IonBackButton,
	IonButtons,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
	IonItem,
	IonLabel,
	IonList,
	IonAlert,
	getConfig,
	IonCardContent,
} from "@ionic/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { hourglass, library, eye } from "ionicons/icons"
import "./Profile.css"
import { useHistory } from "react-router"

const SettingsProfilePage: React.FC = () => {
	const queryClient = useQueryClient()
	const history = useHistory()
	const [{ username, accessToken, secretToken }, _, clearAuth] = useAuth()
	const ionConfig = getConfig()
	const currentMode = ionConfig?.get("mode") || "ios"

	const lightMode = currentMode === "ios" ? "light" : undefined

	const { data, isLoading, isError } = useQuery<IProfile>({
		queryKey: [`${username}profile`],
		queryFn: () => getProfile(username ?? "", accessToken ?? "", secretToken ?? ""),
		staleTime: Infinity,
	})

	if (!username || isError) {
		return <FullpageInfo text="An error occurred when loading information." />
	}

	if (isLoading) {
		return <FullpageLoading />
	}

	const yearJoined = new Date(data?.registered ?? 0).getFullYear()

	const deleteData = () => {
		queryClient.clear()
		clearAuth()
		history.push("/")
		window.location.reload()
	}

	console.log(data)

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start" collapse={true}>
						<IonBackButton />
					</IonButtons>
					<IonTitle>Profile</IonTitle>
				</IonToolbar>
				<InfoBanners />
			</IonHeader>
			<IonContent className="ion-padding">
				<div
					className="avatar-background"
					style={{ backgroundImage: data?.banner_base64 ? `url(${data.banner_base64})` : undefined }}
				>
					<div className="profile-column">
						<IonAvatar>
							<img
								src={data?.avatar_base64 ?? "/album-placeholder.png"}
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
						<IonCardContent>{data?.profile}</IonCardContent>
					</IonCard>
					<br />
				</div>
				<IonList inset={true}>
					<IonItem color={lightMode}>
						<IonLabel>Registered</IonLabel>
						<IonLabel slot="end">{yearJoined}</IonLabel>
					</IonItem>
					<IonItem color={lightMode}>
						<IonLabel>Collected</IonLabel>
						<IonLabel slot="end">{data?.num_collection}</IonLabel>
					</IonItem>
					<IonItem color={lightMode}>
						<IonLabel>Wanted</IonLabel>
						<IonLabel slot="end">{data?.num_wantlist}</IonLabel>
					</IonItem>
				</IonList>
				<IonList inset={true}>
					<IonItem id="present-logout" color={lightMode} button detail={false}>
						<IonLabel color="danger">Log out</IonLabel>
					</IonItem>
				</IonList>
				<IonAlert
					header="Do you want to log out?"
					trigger="present-logout"
					buttons={[
						{
							text: "Cancel",
							role: "cancel",
						},
						{
							text: "Confirm",
							role: "confirm",
							handler: deleteData,
						},
					]}
				/>
			</IonContent>
		</IonPage>
	)
}

export default SettingsProfilePage
