import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonCard } from "@ionic/react"
import { QRCodeSVG } from "qrcode.react"

interface DisplayProps {
	title: string
	codeContent: string
	open: boolean
	onClose: () => void
}

const QRCodeDialog: React.FC<DisplayProps> = ({ title, codeContent, open, onClose }) => (
	<IonModal isOpen={open} onDidDismiss={() => onClose()}>
		<IonHeader>
			<IonToolbar>
				<IonTitle>{title}</IonTitle>
				<IonButtons slot="start">
					<IonButton onClick={() => onClose()}>Close</IonButton>
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

export default QRCodeDialog
