import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react"

const SearchPage: React.FC = () => {
	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Search</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen></IonContent>
		</IonPage>
	)
}

export default SearchPage
