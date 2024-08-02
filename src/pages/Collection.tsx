import {
	IonContent,
	IonHeader,
	IonItem,
	IonList,
	IonPage,
	IonSelect,
	IonSelectOption,
	IonTitle,
	IonToolbar,
} from "@ionic/react"
import ExploreContainer from "../components/ExploreContainer"
import { useQuery } from "@tanstack/react-query"
import { ICollections, getCollectionReleases } from "../api"
import "./collection.css"

const CollectionPage: React.FC = () => {
	// const query = useQuery<ICollections>({
	// 	queryKey: ["todos"],
	// 	queryFn: getCollectionReleases,
	// })

	// if (query.data) {
	// 	console.log("aaa", query.data?.releases[0].basic_information.title)
	// }

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>
						<IonList>
							<IonItem>
								<IonSelect aria-label="Fruit" interface="popover" value="albums">
									<IonSelectOption value="artists">Artists</IonSelectOption>
									<IonSelectOption value="albums">Albums</IonSelectOption>
									<IonSelectOption value="labels">Labels</IonSelectOption>
								</IonSelect>
							</IonItem>
						</IonList>
					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				<ExploreContainer name="Tab 1 page" />
			</IonContent>
		</IonPage>
	)
}

export default CollectionPage
