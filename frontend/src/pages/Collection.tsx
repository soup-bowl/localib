import { useEffect, useState } from "react"
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonLabel,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonSegment,
	IonSegmentButton,
	IonTitle,
	IonToolbar,
	RefresherEventDetail,
	useIonActionSheet,
} from "@ionic/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { filterOutline, personOutline, pricetagOutline, timeOutline, listOutline, gridOutline } from "ionicons/icons"
import { IReleases, getCollectionReleases, getCollectionWants } from "../api"
import { FullpageLoading, AlbumGrid, FullpageInfo, AlbumListGroups } from "../components"
import { ViewAlbumDetails } from "../modal"
import { useAuth } from "../hooks"
import { masterSort } from "../utils"

const filterActionButtons = [
	{
		text: "None",
		data: {
			action: "none",
		},
	},
	{
		text: "Artists",
		data: {
			action: "artist",
		},
	},
	{
		text: "Year Collected",
		data: {
			action: "release",
		},
	},
	{
		text: "Record Label",
		data: {
			action: "label",
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
	const [filter, setFilter] = useState<"release" | "label" | "artist" | "none">("none")
	const [layout, setLayout] = useState<"grid" | "list">("grid")
	const [modalInfo, setModalInfo] = useState<IReleases | undefined>(undefined)
	const [loading, setLoading] = useState<{ page: number; pages: number }>({ page: 0, pages: 0 })
	const [viewState, setViewState] = useState<"collection" | "want">("collection")
	const [dataSorted, setDataSorted] = useState<{ collected: any; wanted: any }>()
	const betaBanner = import.meta.env.VITE_BETA_BANNER

	const [{ username, token }, saveAuth, clearAuth] = useAuth()

	const getFilterIcon = (filter: string) => {
		switch (filter) {
			default:
			case "none":
				return filterOutline
			case "label":
				return pricetagOutline
			case "artist":
				return personOutline
			case "release":
				return timeOutline
		}
	}

	const getLayoutIcon = (item: string) => {
		switch (item) {
			default:
			case "grid":
				return gridOutline
			case "list":
				return listOutline
		}
	}

	if (!username) {
		return (
			<IonPage>
				<IonContent fullscreen>
					<FullpageInfo text="You are not logged in." />
				</IonContent>
			</IonPage>
		)
	}

	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await queryClient.invalidateQueries({
			queryKey: [`${username}collection`, `${username}want`],
		})
		event.detail.complete()
	}

	const collectionData = useQuery<IReleases[]>({
		queryKey: [`${username}collection`],
		queryFn: () =>
			getCollectionReleases(username, token ?? "", (page, pages) => setLoading({ page: page, pages: pages })),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	const wantData = useQuery<IReleases[]>({
		queryKey: [`${username}want`],
		queryFn: () =>
			getCollectionWants(username, token ?? "", (page, pages) => setLoading({ page: page, pages: pages })),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	useEffect(() => {
		setDataSorted({
			collected: masterSort(filter, collectionData.data ?? []),
			wanted: masterSort(filter, wantData.data ?? []),
		})
	}, [filter, collectionData.data, wantData.data])

	if (collectionData.isLoading || wantData.isLoading) {
		return (
			<IonPage>
				<FullpageLoading loadingProgress={loading.page + 1} loadingComplete={loading.pages} />
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
					<IonButtons slot="primary">
						<IonButton
							onClick={() => {
								if (layout === "grid") {
									setLayout("list")
								} else {
									setLayout("grid")
								}
							}}
						>
							<IonIcon slot="icon-only" md={getLayoutIcon(layout)}></IonIcon>
						</IonButton>
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
							<IonIcon slot="icon-only" md={getFilterIcon(filter)}></IonIcon>
						</IonButton>
					</IonButtons>
					<IonSegment
						value={viewState}
						onIonChange={(e) => {
							const selectedValue = e.detail.value
							if (selectedValue === "collection" || selectedValue === "want") {
								setViewState(selectedValue)
							} else {
								setViewState("collection")
							}
						}}
					>
						<IonSegmentButton value="collection">
							<IonLabel>Collection</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="want">
							<IonLabel>Wanted</IonLabel>
						</IonSegmentButton>
					</IonSegment>
				</IonToolbar>
				{betaBanner && (
					<IonToolbar className="beta-banner" color="warning">
						<IonTitle>{betaBanner}</IonTitle>
					</IonToolbar>
				)}
			</IonHeader>
			<IonContent fullscreen>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>
				{viewState === "collection" && collectionData.data && (
					<>
						{layout === "grid" ? (
							<AlbumGrid data={dataSorted?.collected} onClickAlbum={(album) => setModalInfo(album)} />
						) : (
							<AlbumListGroups
								data={dataSorted?.collected}
								onClickAlbum={(album) => setModalInfo(album)}
							/>
						)}
					</>
				)}

				{viewState === "want" && wantData.data && (
					<>
						{layout === "grid" ? (
							<AlbumGrid data={dataSorted?.wanted} onClickAlbum={(album) => setModalInfo(album)} />
						) : (
							<AlbumListGroups data={dataSorted?.wanted} onClickAlbum={(album) => setModalInfo(album)} />
						)}
					</>
				)}

				{modalInfo && (
					<ViewAlbumDetails
						album={modalInfo}
						open={typeof modalInfo !== "undefined"}
						onClose={() => setModalInfo(undefined)}
					/>
				)}
			</IonContent>
		</IonPage>
	)
}

export default CollectionPage
