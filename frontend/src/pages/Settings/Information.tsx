import {
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonItem,
	IonLabel,
	IonList,
	IonNote,
	IonPopover,
	getConfig,
	IonBackButton,
	IonButtons,
	IonButton,
	IonCol,
	IonGrid,
	IonRow,
	IonIcon,
} from "@ionic/react"
import { shieldCheckmarkOutline, warningOutline } from "ionicons/icons"
import { useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { IReleaseSet } from "@/api"
import { useAuth } from "@/hooks"
import {
	formatBytes,
	checkStoragePersistence,
	getStoragePersistenceMessage,
	type StoragePersistenceStatus,
} from "@/utils"
import { InfoBanners } from "@/components"

const SettingsInformationPage: React.FC = () => {
	const queryClient = useQueryClient()
	const [{ username }] = useAuth()
	const [storageInfo, setStorageInfo] = useState<{ usage: string; quota: string } | undefined>()
	const [persistenceStatus, setPersistenceStatus] = useState<StoragePersistenceStatus | undefined>()
	const ionConfig = getConfig()
	const currentMode = ionConfig?.get("mode") ?? "ios"

	useEffect(() => {
		if ("storage" in navigator && "estimate" in navigator.storage) {
			navigator.storage.estimate().then(({ usage, quota }) => {
				if (usage && quota) {
					setStorageInfo({ usage: formatBytes(usage), quota: formatBytes(quota) })
				}
			})
		}

		// Check storage persistence status
		checkStoragePersistence()
			.then((status) => {
				setPersistenceStatus(status)
			})
			.catch((error) => {
				console.error("Failed to check storage persistence:", error)
			})
	}, [])

	const collection = queryClient.getQueryData<IReleaseSet>([`${username}collectionv2`])
	const collectionMissing = collection?.collection.filter((obj) => obj.image_base64 === undefined).length ?? 0
	const wantedMissing = collection?.wants.filter((obj) => obj.image_base64 === undefined).length ?? 0

	const inStorageInfo = {
		collectionCount: collection?.collection.length ?? 0,
		collectionMissing: collectionMissing,
		wantedCount: collection?.wants.length ?? 0,
		wantedMissing: wantedMissing,
		totalCount: (collection?.collection.length ?? 0) + (collection?.wants.length ?? 0),
		totalMissing: collectionMissing + wantedMissing,
	}

	const lightMode = currentMode === "ios" ? "light" : undefined

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start" collapse={true}>
						<IonBackButton />
					</IonButtons>
					<IonTitle>Information</IonTitle>
				</IonToolbar>
				<InfoBanners />
			</IonHeader>
			<IonContent className="ion-padding">
				<IonList inset={true}>
					<IonItem color={lightMode}>
						<IonLabel>Storage used</IonLabel>
						<IonLabel slot="end">
							{storageInfo?.usage ?? "Unknown"} of {storageInfo?.quota ?? "Unknown"}
						</IonLabel>
					</IonItem>
					{persistenceStatus && (
						<IonItem color={lightMode}>
							<IonIcon
								slot="start"
								icon={persistenceStatus.persisted ? shieldCheckmarkOutline : warningOutline}
								color={persistenceStatus.persisted ? "success" : "warning"}
								aria-label={persistenceStatus.persisted ? "Protected" : "Not Protected"}
							/>
							<IonLabel>
								<h3>Data Persistence</h3>
								<p>{persistenceStatus.persisted ? "Protected" : "Not Protected"}</p>
							</IonLabel>
							<IonLabel id="persistence-tooltip" slot="end" aria-label="Click for more information">
								<span aria-hidden="true">
									{persistenceStatus.supported ? (persistenceStatus.persisted ? "✓" : "⚠") : "✗"}
								</span>
							</IonLabel>
						</IonItem>
					)}
					<IonItem color={lightMode}>
						<IonLabel>Records stored</IonLabel>
						<IonLabel id="reccount-tooltip" slot="end">
							{inStorageInfo.totalCount}
						</IonLabel>
					</IonItem>
					<IonItem color={lightMode}>
						<IonLabel>Records unsynced</IonLabel>
						<IonLabel id="missing-tooltip" slot="end">
							{inStorageInfo.totalMissing}
						</IonLabel>
					</IonItem>
				</IonList>
				{persistenceStatus && (
					<IonPopover trigger="persistence-tooltip" triggerAction="click">
						<IonContent class="ion-padding">
							{getStoragePersistenceMessage(persistenceStatus)}
						</IonContent>
					</IonPopover>
				)}
				<IonPopover trigger="reccount-tooltip" triggerAction="click">
					<IonContent class="ion-padding">
						{inStorageInfo.collectionCount} collected, {inStorageInfo.wantedCount} wanted
					</IonContent>
				</IonPopover>
				<IonPopover trigger="missing-tooltip" triggerAction="click">
					<IonContent class="ion-padding">
						{inStorageInfo.collectionMissing} collected, {inStorageInfo.wantedMissing} wanted
					</IonContent>
				</IonPopover>
				<IonNote color="medium" class="ion-margin-horizontal" style={{ display: "block" }}>
					For some records, we need to collect further information from the Discogs system. This can take some
					time, so try reloading in a few hours to see it change.
				</IonNote>
				<IonList inset={true}>
					<IonItem color={lightMode} button href="https://github.com/soup-bowl/Localib" target="_blank">
						<IonLabel>Source code</IonLabel>
					</IonItem>
				</IonList>

				<IonGrid>
					<IonRow class="ion-justify-content-center">
						<IonCol size="auto">
							<IonButton onClick={() => window.location.reload()} color="primary">
								Reload app
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>
			</IonContent>
		</IonPage>
	)
}

export default SettingsInformationPage
