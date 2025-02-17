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
	IonButton,
	IonIcon,
} from "@ionic/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { hourglass, library, eye, qrCodeOutline, qrCodeSharp } from "ionicons/icons"
import "./Profile.css"
import { useHistory } from "react-router"
import { QRCodeDialog } from "@/modal"
import { ReactNode, useState } from "react"

const SettingsProfilePage: React.FC = () => {
	const queryClient = useQueryClient()
	const history = useHistory()
	const [{ username, accessToken, secretToken }, _, clearAuth] = useAuth()
	const ionConfig = getConfig()
	const [openScanner, setOpenScanner] = useState<boolean>(false)
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

	const ToCardOrNotToCard = ({ background = undefined, children }: { background?: string; children: ReactNode }) => {
		if (Boolean(background)) {
			return (
				<IonCard
					className="avatar-background"
					style={{
						backgroundImage: `url(${background})`,
					}}
				>
					{children}
				</IonCard>
			)
		}

		return <>{children}</>
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start" collapse={true}>
						<IonBackButton />
					</IonButtons>
					<IonButtons slot="primary">
						<IonButton onClick={() => setOpenScanner(true)}>
							<IonIcon slot="icon-only" ios={qrCodeOutline} md={qrCodeSharp} />
						</IonButton>
					</IonButtons>
					<IonTitle>Profile</IonTitle>
				</IonToolbar>
				<InfoBanners />
			</IonHeader>
			<IonContent className="ion-padding">
				<ToCardOrNotToCard background={data?.banner_base64}>
					<div className="profile-column">
						<IonAvatar>
							<img
								src={data?.avatar_base64 ?? "/album-placeholder.png"}
								onError={(e) => ((e.target as HTMLImageElement).src = "/album-placeholder.png")}
								alt=""
							/>
						</IonAvatar>
					</div>
					<IonCard style={{ textAlign: "center", marginBottom: data?.banner_base64 ? 50 : 0 }}>
						<IonCardHeader>
							<IonCardTitle>{data?.username}</IonCardTitle>
							<IonCardSubtitle>{data?.name}</IonCardSubtitle>
						</IonCardHeader>
						<IonCardContent>{data?.profile}</IonCardContent>
					</IonCard>
					<br />
				</ToCardOrNotToCard>
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
			<QRCodeDialog
				title="Share Profile"
				codeContent={`https://www.discogs.com/user/${data?.username}`}
				open={openScanner}
				onClose={() => setOpenScanner(false)}
			/>
		</IonPage>
	)
}

export default SettingsProfilePage
