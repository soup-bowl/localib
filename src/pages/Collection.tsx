import { useContext, useState } from "react"
import {
	IonContent,
	IonHeader,
	IonItem,
	IonList,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonSelect,
	IonSelectOption,
	IonTitle,
	IonToolbar,
	RefresherEventDetail,
} from "@ionic/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { IReleases, getCollectionReleases } from "../api"
import { FullpageLoading, AlbumGrid, FullpageInfo } from "../components"
import { ViewAlbumDetails } from "../modal"
import { UserContext } from "../context/UserContext"
import { splitRecordsByYear } from "../utils"
import "./Collection.css"

const CollectionPage: React.FC = () => {
	const queryClient = useQueryClient()
	const [modalInfo, setModalInfo] = useState<IReleases | undefined>(undefined)
	const [loading, setLoading] = useState<{ page: number; pages: number }>({ page: 0, pages: 0 })
	const [sort, setSort] = useState<"artists" | "albums" | "labels">("albums")

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
		queryFn: () =>
			getCollectionReleases(username, password, (page, pages) => setLoading({ page: page, pages: pages })),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await queryClient.invalidateQueries({ queryKey: ["collection"] })
		event.detail.complete()
	}

	if (data) {
		console.log("Collection Data", data, splitRecordsByYear(data))
	}

	if (isLoading) {
		return (
			<IonPage>
				<FullpageLoading loadingProgress={loading.page + 1} loadingComplete={loading.pages} />
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
			<div className="fancy-header">
				<IonHeader translucent>
					<IonToolbar>
						<IonTitle>
							<IonList>
								<IonItem>
									<IonSelect
										aria-label="SortType"
										interface="popover"
										value={sort}
										onChange={(e) => setSort(e.currentTarget.value)}
									>
										<IonSelectOption value="artists">Artists</IonSelectOption>
										<IonSelectOption value="albums">Albums</IonSelectOption>
										<IonSelectOption value="labels">Labels</IonSelectOption>
									</IonSelect>
								</IonItem>
							</IonList>
						</IonTitle>
					</IonToolbar>
				</IonHeader>
			</div>
			<IonContent fullscreen>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>
				{data && <AlbumGrid data={data} sort="release" onClickAlbum={(album) => setModalInfo(album)} />}

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

export default CollectionPage
