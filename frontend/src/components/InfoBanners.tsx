import React from "react"
import { IonToolbar, IonTitle } from "@ionic/react"
import { useOnlineStatus } from "@/hooks"
import { deviceMode } from "@/theme/deviceTheme"

const InfoBanners: React.FC = () => {
	const isOnline = useOnlineStatus()
	// The iOS 26 theme strips toolbar backgrounds inside translucent headers, so the
	// coloured beta banner can't render properly there. Hide it in that mode.
	const betaBanner = deviceMode === "ios26" ? undefined : import.meta.env.VITE_BETA_BANNER

	return (
		<>
			{betaBanner && (
				<IonToolbar
					className="info-banner"
					color="warning"
					style={{ "--min-height": "30px" } as React.CSSProperties}
				>
					<IonTitle>{betaBanner}</IonTitle>
				</IonToolbar>
			)}
			{!isOnline && (
				<IonToolbar
					className="info-banner"
					color="dark"
					style={{ "--min-height": "30px" } as React.CSSProperties}
				>
					<IonTitle>Offline</IonTitle>
				</IonToolbar>
			)}
		</>
	)
}

export default InfoBanners
