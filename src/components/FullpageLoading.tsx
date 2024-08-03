import { IonProgressBar, IonSpinner } from "@ionic/react"
import "./FullpageLoading.css"

interface Props {
	loadingProgress?: number
	loadingComplete?: number
}

const FullpageLoading: React.FC<Props> = ({ loadingProgress = undefined, loadingComplete = undefined }) => {
	return (
		<div className="loading-container">
			<IonSpinner></IonSpinner>
			{loadingProgress && loadingComplete && (
				<IonProgressBar value={loadingProgress / loadingComplete} color="light" />
			)}
		</div>
	)
}

export default FullpageLoading
