import React from "react"
import { IonToolbar, IonTitle } from "@ionic/react"
import { useOnlineStatus } from "@/hooks"

const InfoBanners: React.FC = () => {
	const isOnline = useOnlineStatus()
	const betaBanner = import.meta.env.VITE_BETA_BANNER

	return (
		<>
			{betaBanner && (
				<IonToolbar className="info-banner" color="warning" style={{ "--min-height": "30px" }}>
					<IonTitle>{betaBanner}</IonTitle>
				</IonToolbar>
			)}
			{!isOnline && (
				<IonToolbar className="info-banner" color="dark" style={{ "--min-height": "30px" }}>
					<IonTitle>Offline</IonTitle>
				</IonToolbar>
			)}
		</>
	)
}

export default InfoBanners
