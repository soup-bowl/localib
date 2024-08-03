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
import { useQuery } from "@tanstack/react-query"
import { IReleases, getCollectionReleases } from "../api"
import { FullpageLoading, AlbumGrid } from "../components"
import "./Collection.css"

const CollectionPage: React.FC = () => {
	const { data, isLoading } = useQuery<IReleases[]>({
		queryKey: ["collection"],
		queryFn: getCollectionReleases,
	})

	if (data) {
		console.log("aaa", data)
	}

	if (isLoading) {
		return (
			<IonPage>
				<FullpageLoading />
			</IonPage>
		)
	}

	return (
		<IonPage>
			<IonHeader translucent>
				<IonToolbar>
					<IonTitle>
						<IonList>
							<IonItem>
								<IonSelect aria-label="SortType" interface="popover" value="albums">
									<IonSelectOption value="artists">Artists</IonSelectOption>
									<IonSelectOption value="albums">Albums</IonSelectOption>
									<IonSelectOption value="labels">Labels</IonSelectOption>
								</IonSelect>
							</IonItem>
						</IonList>
					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>{data && <AlbumGrid data={data} />}</IonContent>
		</IonPage>
	)
}

export default CollectionPage
