import { useState } from "react"
import { IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react"
import { useQuery } from "@tanstack/react-query"
import { IReleases, getCollectionReleases, getCollectionWants } from "../api"
import { AlbumList, FullpageInfo, FullpageLoading } from "../components"
import { ViewAlbumDetails } from "../modal"
import { useAuth } from "../hooks"

interface IReleaseCollective {
	collection: IReleases[]
	want: IReleases[]
}

const SearchPage: React.FC = () => {
	const [modalInfo, setModalInfo] = useState<{ data: IReleases; type: "collection" | "want" } | undefined>(undefined)
	const [filterData, setFilterData] = useState<IReleaseCollective>({ collection: [], want: [] })
	const betaBanner = import.meta.env.VITE_BETA_BANNER

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

	const collectionData = useQuery<IReleases[]>({
		queryKey: [`${username}collection`],
		queryFn: () => getCollectionReleases(username, token ?? ""),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	const wantData = useQuery<IReleases[]>({
		queryKey: [`${username}want`],
		queryFn: () => getCollectionWants(username, token ?? ""),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	const searchData = (search: string) => {
		const lowerCaseSearchTerm = search.toLowerCase()

		const filterItems = (data: typeof collectionData.data | undefined) =>
			data?.filter(
				(item) =>
					item.basic_information.title.toLowerCase().includes(lowerCaseSearchTerm) ||
					item.basic_information.artists.some((artist) =>
						artist.name.toLowerCase().includes(lowerCaseSearchTerm)
					)
			) ?? []

		setFilterData({
			collection: filterItems(collectionData.data),
			want: filterItems(wantData.data),
		})
	}

	if (collectionData.isLoading || wantData.isLoading) {
		return (
			<IonPage>
				<FullpageLoading />
			</IonPage>
		)
	}

	if (collectionData.isError || wantData.isError) {
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
						onIonInput={(ev) => searchData(ev.target.value?.toLowerCase() ?? "")}
					/>
				</IonToolbar>
				{betaBanner && (
					<IonToolbar className="beta-banner" color="warning">
						<IonTitle>{betaBanner}</IonTitle>
					</IonToolbar>
				)}
			</IonHeader>
			<IonContent fullscreen>
				{filterData.collection.length > 0 && (
					<AlbumList
						data={filterData.collection}
						username={username}
						title="Collected"
						type="collection"
						onClickAlbum={(album) =>
							setModalInfo({
								data: album,
								type: "collection",
							})
						}
					/>
				)}

				{filterData.want.length > 0 && (
					<AlbumList
						data={filterData.want}
						username={username}
						title="Wanted"
						type="want"
						onClickAlbum={(album) =>
							setModalInfo({
								data: album,
								type: "want",
							})
						}
					/>
				)}

				{modalInfo && (
					<ViewAlbumDetails
						album={modalInfo.data}
						username={username}
						type={modalInfo.type}
						open={typeof modalInfo !== "undefined"}
						onClose={() => setModalInfo(undefined)}
					/>
				)}
			</IonContent>
		</IonPage>
	)
}

export default SearchPage
