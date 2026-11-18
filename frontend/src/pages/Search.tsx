import { useMemo, useState } from "react"
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
import { IReleases } from "@/api"
import { AlbumList, FullpageInfo, FullpageLoading, InfoBanners } from "@/components"
import { BarcodeScanDialog, ViewAlbumDetails } from "@/modal"
import { useAlbumModal, useCollection, useDeviceTheme } from "@/hooks"

const searchFilter = (item: IReleases, lowerCaseSearchTerm: string) =>
	item.basic_information.title.toLowerCase().includes(lowerCaseSearchTerm) ||
	item.barcode?.toLowerCase().includes(lowerCaseSearchTerm) ||
	item.basic_information.artists.some((artist) => artist.name.toLowerCase().includes(lowerCaseSearchTerm))

const SearchPage: React.FC = () => {
	const { isIos26 } = useDeviceTheme()
	// Kept exactly as typed - lowercasing happens only when filtering, so the input isn't rewritten.
	const [searchTerm, setSearchTerm] = useState<string>("")
	const [openScanner, setOpenScanner] = useState<boolean>(false)
	const modal = useAlbumModal()

	const { isLoading, isError, data } = useCollection()

	// Derived from both the term and the data, so a refreshed collection updates the results too.
	const results = useMemo(() => {
		const term = searchTerm.trim().toLowerCase()
		if (term.length === 0) {
			return { collection: [], wants: [] }
		}
		const filterItems = (items: IReleases[] | undefined) => items?.filter((item) => searchFilter(item, term)) ?? []
		return { collection: filterItems(data?.collection), wants: filterItems(data?.wants) }
	}, [searchTerm, data])

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
			<IonHeader translucent={isIos26}>
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
						onIonInput={(ev) => setSearchTerm(ev.target.value ?? "")}
					/>
				</IonToolbar>
				<InfoBanners />
			</IonHeader>
			<IonContent fullscreen>
				{results.collection.length > 0 && (
					<AlbumList data={results.collection} title="Collected" onClickAlbum={modal.show} />
				)}

				{results.wants.length > 0 && (
					<AlbumList data={results.wants} title="Wanted" onClickAlbum={modal.show} />
				)}

				{searchTerm.trim().length > 0 && results.collection.length + results.wants.length === 0 && (
					<FullpageInfo text="No records matched your search" />
				)}

				<ViewAlbumDetails
					album={modal.album}
					open={modal.open}
					onClose={modal.close}
					onDidDismiss={modal.dismissed}
				/>
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
