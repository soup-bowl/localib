import { IonToolbar, IonTitle } from "@ionic/react"
import { useOnlineStatus } from "@/hooks"

const bannerStyle = { "--min-height": "30px" } as React.CSSProperties

const InfoBanners: React.FC = () => {
	const isOnline = useOnlineStatus()
	const betaBanner = import.meta.env.VITE_BETA_BANNER

	return (
		<>
			{betaBanner && (
				<IonToolbar className="info-banner" color="warning" style={bannerStyle}>
					<IonTitle>{betaBanner}</IonTitle>
				</IonToolbar>
			)}
			{!isOnline && (
				<IonToolbar className="info-banner" color="dark" style={bannerStyle}>
					<IonTitle>Offline</IonTitle>
				</IonToolbar>
			)}
		</>
	)
}

export default InfoBanners
