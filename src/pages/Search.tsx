import {
	IonAvatar,
	IonContent,
	IonHeader,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonSearchbar,
	IonText,
	IonTitle,
	IonToolbar,
} from "@ionic/react"
import { useQuery } from "@tanstack/react-query"
import { IReleases, getCollectionReleases } from "../api"
import { FullpageLoading } from "../components"
import { useState } from "react"
import ViewAlbumDetails from "./ViewAlbumDetails"

const SearchPage: React.FC = () => {
	const [modalInfo, setModalInfo] = useState<IReleases | undefined>(undefined)
	const [filterData, setFilterData] = useState<IReleases[]>([])
	const { data, isLoading } = useQuery<IReleases[]>({
		queryKey: ["collection"],
		queryFn: () => getCollectionReleases(),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	const searchData = (data: IReleases[], search: string) => {
		const lowerCaseSearchTerm = search.toLowerCase()
		setFilterData(
			data.filter(
				(item) =>
					item.basic_information.title.toLowerCase().includes(lowerCaseSearchTerm) ||
					item.basic_information.artists.some((artist) =>
						artist.name.toLowerCase().includes(lowerCaseSearchTerm)
					)
			)
		)
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
			<IonHeader>
				<IonToolbar>
					<IonTitle>Search</IonTitle>
				</IonToolbar>
				<IonToolbar>
					<IonSearchbar
						debounce={1000}
						onIonInput={(ev) => searchData(data ?? [], ev.target.value?.toLowerCase() ?? "")}
					/>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				{filterData.length > 0 && (
					<IonList lines="full">
						{filterData.map((album, index) => (
							<IonItem key={index} onClick={() => setModalInfo(album)}>
								<IonAvatar aria-hidden="true" slot="start">
									<img alt="" src={album.basic_information.thumb} />
								</IonAvatar>
								<IonLabel>
									<strong>{album.basic_information.title}</strong>
									<br />
									<IonText>{album.basic_information.artists[0].name}</IonText>
								</IonLabel>
							</IonItem>
						))}
					</IonList>
				)}

				{modalInfo && (
					<ViewAlbumDetails
						album={modalInfo}
						open={typeof modalInfo !== undefined}
						onClose={() => setModalInfo(undefined)}
					/>
				)}
			</IonContent>
		</IonPage>
	)
}

export default SearchPage
