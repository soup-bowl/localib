import { useState } from "react"
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
	const [loading, setLoading] = useState<{ page: number, pages: number }>({ page: 0, pages: 0 });
	const [sort, setSort] = useState<"artists" | "albums" | "labels">("albums");

	const { data, isLoading } = useQuery<IReleases[]>({
		queryKey: ["collection"],
		queryFn: () => getCollectionReleases((page, pages) => setLoading({ page: page, pages: pages })),
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
								<IonSelect aria-label="SortType" interface="popover" value={sort} onChange={(e) => setSort(e.currentTarget.value)}>
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
