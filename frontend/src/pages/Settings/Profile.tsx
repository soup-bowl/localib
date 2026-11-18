import { IProfile, getProfile } from "@/api"
import { FullpageInfo, FullpageLoading, InfoBanners, ThemeItemGroup } from "@/components"
import { useAuth, useDeviceTheme } from "@/hooks"
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
	IonCardContent,
	IonButton,
	IonIcon,
} from "@ionic/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { qrCodeOutline, qrCodeSharp } from "ionicons/icons"
import "./Profile.css"
import { QRCodeDialog } from "@/modal"
import { ReactNode, useState } from "react"

const ToCardOrNotToCard = ({ background = undefined, children }: { background?: string; children: ReactNode }) => {
	if (background) {
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

const SettingsProfilePage: React.FC = () => {
	const queryClient = useQueryClient()
	const [{ username, accessToken, secretToken }, , clearAuth] = useAuth()
	const { isIos26, itemColor: lightMode } = useDeviceTheme()
	const [openScanner, setOpenScanner] = useState<boolean>(false)

	// Tokens are deliberately left out of the query key - they don't change what data is returned.
	// eslint-disable-next-line @tanstack/query/exhaustive-deps
	const { data, isLoading, isError } = useQuery<IProfile>({
		queryKey: [`${username}profile`],
		queryFn: () => getProfile(username ?? "", accessToken ?? "", secretToken ?? ""),
		staleTime: Infinity,
		enabled: Boolean(username && accessToken && secretToken),
	})

	// Ionic pages must always be wrapped in IonPage, otherwise page transitions can paint incorrectly.
	if (!username || isError) {
		return (
			<IonPage>
				<FullpageInfo text="An error occurred when loading information." />
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

	const deleteData = () => {
		queryClient.clear()
		clearAuth()
		window.location.replace(import.meta.env.BASE_URL)
	}

	return (
		<IonPage>
			<IonHeader translucent={isIos26}>
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
					<ThemeItemGroup>
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
					</ThemeItemGroup>
				</IonList>
				<IonList inset={true}>
					<ThemeItemGroup>
						<IonItem id="present-logout" color={lightMode} button detail={false}>
							<IonLabel color="danger">Log out</IonLabel>
						</IonItem>
					</ThemeItemGroup>
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
