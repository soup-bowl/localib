import { IonSpinner } from "@ionic/react"
import "./FullpageLoading.css"

const FullpageLoading: React.FC = () => {
	return (
		<div className="loading-container">
			<IonSpinner></IonSpinner>
		</div>
	)
}

export default FullpageLoading
