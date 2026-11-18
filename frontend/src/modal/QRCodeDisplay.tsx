import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonCard } from "@ionic/react"
import { QRCodeSVG } from "qrcode.react"
import { useDeviceTheme } from "@/hooks"

interface DisplayProps {
	title: string
	codeContent: string
	open: boolean
	onClose: () => void
}

const QRCodeDialog: React.FC<DisplayProps> = ({ title, codeContent, open, onClose }) => {
	const { isIos26 } = useDeviceTheme()

	return (
		<IonModal isOpen={open} onDidDismiss={onClose}>
			<IonHeader translucent={isIos26}>
				<IonToolbar>
					<IonTitle>{title}</IonTitle>
					<IonButtons slot="start">
						<IonButton onClick={onClose}>Close</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonCard style={{ backgroundColor: "white", padding: 20 }}>
					<QRCodeSVG value={codeContent} width="100%" height="400" />
				</IonCard>
			</IonContent>
		</IonModal>
	)
}

export default QRCodeDialog
