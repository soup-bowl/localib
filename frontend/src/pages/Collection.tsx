import { useMemo, useState } from "react"
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
	IonToolbar,
	RefresherEventDetail,
	useIonActionSheet,
} from "@ionic/react"
import { useQueryClient } from "@tanstack/react-query"
import { FullpageLoading, AlbumGrid, FullpageInfo, AlbumListGroups, InfoBanners } from "@/components"
import { ViewAlbumDetails } from "@/modal"
import { useAlbumModal, useAuth, useCollection, useDeviceTheme, useSettings } from "@/hooks"
import { CollectionSort, getFilterIcon, getLayoutIcon, masterSort } from "@/utils"

const filterActionButtons = [
	{ text: "None", data: { action: "none" } },
	{ text: "Artists", data: { action: "artist" } },
	{ text: "Year Collected", data: { action: "release" } },
	{ text: "Record Label", data: { action: "label" } },
	{ text: "Cancel", role: "cancel", data: { action: "cancel" } },
]

const CollectionPage: React.FC = () => {
	const queryClient = useQueryClient()
	const [present] = useIonActionSheet()
	const { isIos26 } = useDeviceTheme()
	const [{ username }] = useAuth()
	const [filter, setFilter] = useSettings<CollectionSort>("collectionFilter", "none")
	const [layout, setLayout] = useSettings<"grid" | "list">("collectionLayout", "grid")
	const [loading, setLoading] = useState<{ page: number; pages: number }>({ page: 0, pages: 0 })
	const [viewState, setViewState] = useState<"collection" | "want">("collection")
	const modal = useAlbumModal()

	const { isLoading, isError, data } = useCollection((page, pages) => setLoading({ page, pages }))

	// Only sort the list currently on screen, and only when the data, filter or tab changes.
	const sorted = useMemo(() => {
		const records = viewState === "collection" ? data?.collection : data?.wants
		return masterSort(filter, records ?? [])
	}, [filter, data, viewState])

	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await queryClient.invalidateQueries({ queryKey: [`${username}collectionv2`] })
		event.detail.complete()
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
			<IonHeader translucent={isIos26}>
				<IonToolbar>
					<IonButtons slot="primary">
						<IonButton onClick={() => setLayout(layout === "grid" ? "list" : "grid")}>
							<IonIcon
								slot="icon-only"
								ios={getLayoutIcon(layout, "ios")}
								md={getLayoutIcon(layout, "md")}
							/>
						</IonButton>
						<IonButton
							onClick={() =>
								present({
									header: "Sorting",
									buttons: filterActionButtons,
									onDidDismiss: ({ detail }) => {
										if (detail.data && detail.data.action !== "cancel") {
											setFilter(detail.data.action)
										}
									},
								})
							}
						>
							<IonIcon
								slot="icon-only"
								ios={getFilterIcon(filter, "ios")}
								md={getFilterIcon(filter, "md")}
							/>
						</IonButton>
					</IonButtons>
					<IonSegment
						value={viewState}
						onIonChange={(e) => setViewState(e.detail.value === "want" ? "want" : "collection")}
					>
						<IonSegmentButton value="collection">
							<IonLabel>Collection</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="want">
							<IonLabel>Wanted</IonLabel>
						</IonSegmentButton>
					</IonSegment>
				</IonToolbar>
				<InfoBanners />
			</IonHeader>
			<IonContent fullscreen>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent />
				</IonRefresher>
				{data &&
					(layout === "grid" ? (
						<AlbumGrid data={sorted} onClickAlbum={modal.show} />
					) : (
						<AlbumListGroups data={sorted} onClickAlbum={modal.show} />
					))}

				<ViewAlbumDetails
					album={modal.album}
					open={modal.open}
					onClose={modal.close}
					onDidDismiss={modal.dismissed}
				/>
			</IonContent>
		</IonPage>
	)
}

export default CollectionPage
