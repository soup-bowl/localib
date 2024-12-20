import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent } from "@ionic/react"
import { BarcodeScanner, DetectedBarcode } from "react-barcode-scanner"
import "react-barcode-scanner/polyfill"

interface DisplayProps {
	open: boolean
	onClose: () => void
	onSuccess: (value: string) => void
}

const BarcodeScanDialog: React.FC<DisplayProps> = ({ open, onClose, onSuccess }) => (
	<IonModal isOpen={open} onDidDismiss={() => onClose()}>
		<IonHeader>
			<IonToolbar>
				<IonTitle>Scanner</IonTitle>
				<IonButtons slot="start">
					<IonButton onClick={() => onClose()}>Close</IonButton>
				</IonButtons>
			</IonToolbar>
		</IonHeader>
		<IonContent className="ion-padding">
			<BarcodeScanner
				onCapture={(barcodes: DetectedBarcode[]) => onSuccess(barcodes[0].rawValue)}
				options={{
					formats: ["code_39", "code_93", "code_128", "ean_8", "ean_13", "upc_a", "upc_e"],
				}}
			/>
		</IonContent>
	</IonModal>
)

export default BarcodeScanDialog
