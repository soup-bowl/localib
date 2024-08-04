import { useContext, useState } from "react"
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonTitle,
	IonToolbar,
	RefresherEventDetail,
	useIonActionSheet,
} from "@ionic/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { IReleases, getCollectionReleases } from "../api"
import { FullpageLoading, AlbumGrid, FullpageInfo } from "../components"
import { ViewAlbumDetails } from "../modal"
import { UserContext } from "../context/UserContext"
import { splitRecordsByYear } from "../utils"
import { filter as filterIcon } from "ionicons/icons"

const filterActionButtons = [
	{
		text: "None",
		data: {
			action: "none",
		},
	},
	{
		text: "Year Collected",
		data: {
			action: "release",
		},
	},
	{
		text: "Cancel",
		role: "cancel",
		data: {
			action: "cancel",
		},
	},
]

const CollectionPage: React.FC = () => {
	const queryClient = useQueryClient()
	const [present] = useIonActionSheet()
	const [filter, setFilter] = useState<"none" | "release">("none")
	const [modalInfo, setModalInfo] = useState<IReleases | undefined>(undefined)
	const [loading, setLoading] = useState<{ page: number; pages: number }>({ page: 0, pages: 0 })

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
			<IonHeader translucent>
				<IonToolbar>
					<IonButtons slot="primary">
						<IonButton
							onClick={() =>
								present({
									header: "Sorting",
									buttons: filterActionButtons,
									onDidDismiss: ({ detail }) => {
										if (detail.data.action !== "cancel") {
											setFilter(detail.data.action)
										}
									},
								})
							}
						>
							<IonIcon slot="icon-only" md={filterIcon}></IonIcon>
						</IonButton>
					</IonButtons>
					<IonTitle>Collection</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>
				{data && <AlbumGrid data={data} sort={filter} onClickAlbum={(album) => setModalInfo(album)} />}

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
