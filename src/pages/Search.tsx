import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react"
import { useQuery } from "@tanstack/react-query"
import { IReleases, getCollectionReleases } from "../api"
import { FullpageLoading } from "../components"
import { useEffect, useState } from "react"

const SearchPage: React.FC = () => {
	const [filterData, setFilterData] = useState<IReleases[]>([])
	// const { data, isLoading } = useQuery<IReleases[]>({
	// 	queryKey: ["collection"],
	// 	queryFn: () => getCollectionReleases(),
	// 	staleTime: 1000 * 60 * 60 * 24, // 24 hours
	// })

	// const searchData = (data: IReleases[], search: string) => {
	// 	const lowerCaseSearchTerm = search.toLowerCase();
	// 	setFilterData(data.filter(item =>
	// 		item.basic_information.title.toLowerCase().includes(lowerCaseSearchTerm) ||
	// 		item.basic_information.artists.some(artist => artist.name.toLowerCase().includes(lowerCaseSearchTerm))
	// 	));
	// }

	useEffect(() => console.log("Filtered data", filterData), [filterData])

	// if (isLoading) {
	// 	return (
	// 		<IonPage>
	// 			<FullpageLoading />
	// 		</IonPage>
	// 	)
	// }

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Search</IonTitle>
				</IonToolbar>
				<IonToolbar>
					{/* <IonSearchbar debounce={1000} onIonInput={(ev) => searchData(data ?? [], ev.target.value?.toLowerCase() ?? '')} /> */}
				</IonToolbar>
			</IonHeader>
			{/* {filterData.length > 0 && */}
				<IonList>
					<IonItem>Test 1</IonItem>
					<IonItem>Test 2</IonItem>
					<IonItem>Test 3</IonItem>
					<IonItem>Test 4</IonItem>
					<IonItem>Test 5</IonItem>
					<IonItem>Test 6</IonItem>
					<IonItem>Test 7</IonItem>
					<IonItem>Test 8</IonItem>
					{/* {filterData.map((album, index) => (
						<IonItem key={index}>
							{album.basic_information.title}
						</IonItem>
					))} */}
				</IonList>
			{/* } */}
			<IonContent fullscreen></IonContent>
		</IonPage>
	)
}

export default SearchPage
