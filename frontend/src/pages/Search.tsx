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
import { barcodeOutline, barcodeSharp } from "ionicons/icons"
import { useQuery } from "@tanstack/react-query"
import { IReleaseSet, IReleases, getCollectionAndWants } from "@/api"
import { AlbumList, FullpageInfo, FullpageLoading, InfoBanners } from "@/components"
import { BarcodeScanDialog, ViewAlbumDetails } from "@/modal"
import { useAuth, useSettings } from "@/hooks"

const searchFilter = (item: IReleases, lowerCaseSearchTerm: string) =>
	item.basic_information.title.toLowerCase().includes(lowerCaseSearchTerm) ||
	item.barcode?.includes(lowerCaseSearchTerm) ||
	item.basic_information.artists.some((artist) => artist.name.toLowerCase().includes(lowerCaseSearchTerm))

const SearchPage: React.FC = () => {
	const [imageQuality] = useSettings<boolean>("ImagesAreHQ", false)
	const [searchTerm, setSearchTerm] = useState<string>("")
	const [modalInfo, setModalInfo] = useState<{ data: IReleases; type: "collection" | "want" } | undefined>(undefined)
	const [filterData, setFilterData] = useState<IReleaseSet>({ collection: [], wants: [] })
	const [openScanner, setOpenScanner] = useState<boolean>(false)

	const [{ username, accessToken, secretToken }] = useAuth()

	const { isLoading, isError, data } = useQuery<IReleaseSet>({
		queryKey: [`${username}collectionv2`],
		queryFn: () => getCollectionAndWants(username!, accessToken ?? "", secretToken ?? "", imageQuality),
		staleTime: Infinity,
	})

	const searchData = (search: string) => {
		if (search.length === 0) {
			setFilterData({ collection: [], wants: [] })
			return
		}

		const filterItems = (data: IReleases[] | undefined) =>
			data?.filter((item) => searchFilter(item, search.toLowerCase())) ?? []

		setFilterData({
			collection: filterItems(data?.collection),
			wants: filterItems(data?.wants),
		})
	}

	useEffect(() => {
		searchData(searchTerm)
	}, [searchTerm])

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
					<IonButtons slot="end">
						<IonButton onClick={() => setOpenScanner(true)}>
							<IonIcon slot="icon-only" ios={barcodeOutline} md={barcodeSharp} />
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
				<InfoBanners />
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

				{filterData.wants.length > 0 && (
					<AlbumList
						data={filterData.wants}
						title="Wanted"
						onClickAlbum={(album) =>
							setModalInfo({
								data: album,
								type: "want",
							})
						}
					/>
				)}

				{filterData.collection.length + filterData.wants.length <= 0 && (
					<FullpageInfo text="No records matched your search" />
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
