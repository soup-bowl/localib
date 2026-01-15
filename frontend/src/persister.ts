import { PersistedClient, Persister } from "@tanstack/react-query-persist-client"
import { set, get, del } from "idb-keyval"
import { requestStoragePersistence } from "@/utils"

// https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient?from=reactQueryV3#building-a-persister
export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
	// Request persistent storage when the persister is created (async, non-blocking)
	// This helps prevent mobile browsers from clearing IndexedDB data
	// Fire-and-forget pattern ensures it doesn't block persister initialization
	requestStoragePersistence().catch((error) => {
		console.error("Failed to request storage persistence:", error)
	})

	return {
		persistClient: async (client: PersistedClient) => {
			await set(idbValidKey, client)
		},
		restoreClient: async () => {
			return await get<PersistedClient>(idbValidKey)
		},
		removeClient: async () => {
			await del(idbValidKey)
		},
	} as Persister
}
