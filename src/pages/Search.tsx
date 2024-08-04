import { useContext, useState } from "react"
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
import { FullpageInfo, FullpageLoading } from "../components"
import { ViewAlbumDetails } from "../modal"
import { UserContext } from "../context/UserContext"

const SearchPage: React.FC = () => {
	const [modalInfo, setModalInfo] = useState<IReleases | undefined>(undefined)
	const [filterData, setFilterData] = useState<IReleases[]>([])

	const userContext = useContext(UserContext)

	if (!userContext) {
		throw new Error("useApi must be used within a UserProvider")
	}

	const { username, password } = userContext

	if (!username) {
		return (
			<IonPage>
				<IonContent fullscreen>
					<FullpageInfo text="You are not logged in." />
				</IonContent>
			</IonPage>
		)
	}

	const { data, isLoading, isError } = useQuery<IReleases[]>({
		queryKey: ["collection"],
		queryFn: () => getCollectionReleases(username, password),
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

	if (isError) {
		return (
			<IonPage>
				<FullpageInfo text="An error occurred when loading information." />
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
