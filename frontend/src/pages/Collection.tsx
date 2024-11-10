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
	IonToolbar,
	RefresherEventDetail,
	SegmentChangeEventDetail,
	useIonActionSheet,
} from "@ionic/react"
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { personOutline, personSharp } from "ionicons/icons"
import { IReleaseSet, IReleases, getCollectionAndWants } from "@/api"
import { FullpageLoading, AlbumGrid, FullpageInfo, AlbumListGroups, InfoBanners } from "@/components"
import { ProfileModal, ViewAlbumDetails } from "@/modal"
import { useAuth, useSettings } from "@/hooks"
import { getFilterIcon, getLayoutIcon, masterSort } from "@/utils"
import { IReleaseTuple } from "@/types"

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
	const [imageQuality] = useSettings<boolean>("ImagesAreHQ", false)
	const [filter, setFilter] = useSettings<"release" | "label" | "artist" | "none">("collectionFilter", "none")
	const [layout, setLayout] = useSettings<"grid" | "list">("collectionLayout", "grid")
	const [modalInfo, setModalInfo] = useState<IReleases | undefined>(undefined)
	const [loading, setLoading] = useState<{ page: number; pages: number }>({ page: 0, pages: 0 })
	const [profileModal, setProfileModal] = useState<boolean>(false)
	const [viewState, setViewState] = useState<"collection" | "want">("collection")
	const [dataSorted, setDataSorted] = useState<{
		collected: IReleaseTuple
		wanted: IReleaseTuple
	}>()

	const [{ username, token }] = useAuth()

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
			queryKey: [`${username}collectionv2`],
		})
		event.detail.complete()
	}

	const { isLoading, isError, data } = useQuery<IReleaseSet>({
		queryKey: [`${username}collectionv2`],
		queryFn: () =>
			getCollectionAndWants(username, token ?? "", imageQuality, (page, pages) =>
				setLoading({ page: page, pages: pages })
			),
		staleTime: Infinity,
	})

	useEffect(() => {
		setDataSorted({
			collected: masterSort(filter, data?.collection ?? []),
			wanted: masterSort(filter, data?.wants ?? []),
		})
	}, [filter, data])

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
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="secondary">
						<IonButton onClick={() => setProfileModal(true)}>
							<IonIcon slot="icon-only" ios={personOutline} md={personSharp} />
						</IonButton>
					</IonButtons>
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
									onDidDismiss: ({ detail }: CustomEvent<OverlayEventDetail>) => {
										if (detail.data.action !== "cancel") {
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
						onIonChange={(e: CustomEvent<SegmentChangeEventDetail>) => {
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
				<InfoBanners />
			</IonHeader>
			<IonContent fullscreen>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent />
				</IonRefresher>
				{viewState === "collection" && data && dataSorted && (
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

				{viewState === "want" && data && dataSorted && (
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
			<ProfileModal open={profileModal} onClose={() => setProfileModal(false)} />
		</IonPage>
	)
}

export default CollectionPage
