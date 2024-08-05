import { useState } from "react"
import { IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react"
import { useQuery } from "@tanstack/react-query"
import { IReleases, getCollectionReleases } from "../api"
import { AlbumList, FullpageInfo, FullpageLoading } from "../components"
import { ViewAlbumDetails } from "../modal"
import { useAuth } from "../hooks"

const SearchPage: React.FC = () => {
	const [modalInfo, setModalInfo] = useState<IReleases | undefined>(undefined)
	const [filterData, setFilterData] = useState<IReleases[]>([])

	const [{ username, token }, saveAuth, clearAuth] = useAuth()

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
		queryKey: [`${username}collection`],
		queryFn: () => getCollectionReleases(username ?? "", token ?? ""),
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
			<IonContent>
				{filterData.length > 0 && <AlbumList data={filterData} onClickAlbum={(album) => setModalInfo(album)} />}

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
