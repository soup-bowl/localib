import { useEffect, useState } from "react"
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonSearchbar,
	IonTitle,
	IonToolbar,
} from "@ionic/react"
import { useQuery } from "@tanstack/react-query"
import { IReleases, getCollectionReleases, getCollectionWants } from "../api"
import { AlbumList, FullpageInfo, FullpageLoading } from "../components"
import { BarcodeScanDialog, ViewAlbumDetails } from "../modal"
import { useAuth, useSettings } from "../hooks"
import { barcodeOutline } from "ionicons/icons"

interface IReleaseCollective {
	collection: IReleases[]
	want: IReleases[]
}

const SearchPage: React.FC = () => {
	const [imageQuality, setImageQuality, clearImagequality] = useSettings<boolean>("ImagesAreHQ", false)
	const [searchTerm, setSearchTerm] = useState<string>("")
	const [modalInfo, setModalInfo] = useState<{ data: IReleases; type: "collection" | "want" } | undefined>(undefined)
	const [filterData, setFilterData] = useState<IReleaseCollective>({ collection: [], want: [] })
	const [openScanner, setOpenScanner] = useState<boolean>(false)
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
		queryFn: () => getCollectionReleases(username, token ?? "", imageQuality),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	const wantData = useQuery<IReleases[]>({
		queryKey: [`${username}want`],
		queryFn: () => getCollectionWants(username, token ?? "", imageQuality),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	})

	const searchData = (search: string) => {
		if (search.length === 0) {
			setFilterData({ collection: [], want: [] })
			return
		}

		const lowerCaseSearchTerm = search.toLowerCase()

		const filterItems = (data: typeof collectionData.data | undefined) =>
			data?.filter(
				(item) =>
					item.basic_information.title.toLowerCase().includes(lowerCaseSearchTerm) ||
					item.barcode?.includes(lowerCaseSearchTerm) ||
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

	useEffect(() => {
		searchData(searchTerm)
	}, [searchTerm])

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Search</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => setOpenScanner(true)}>
							<IonIcon slot="icon-only" icon={barcodeOutline}></IonIcon>
						</IonButton>
					</IonButtons>
				</IonToolbar>
				<IonToolbar>
					<IonSearchbar
						value={searchTerm}
						debounce={1000}
						onIonInput={(ev) => setSearchTerm(ev.target.value?.toLowerCase() ?? "")}
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
						title="Collected"
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
						title="Wanted"
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
						open={typeof modalInfo !== "undefined"}
						onClose={() => setModalInfo(undefined)}
					/>
				)}
			</IonContent>
			<BarcodeScanDialog
				open={openScanner}
				onClose={() => setOpenScanner(false)}
				onSuccess={(value) => {
					setSearchTerm(value)
					setOpenScanner(false)
				}}
			/>
		</IonPage>
	)
}

export default SearchPage
