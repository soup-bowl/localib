import { PersistedClient, Persister } from "@tanstack/react-query-persist-client"
import { set, get, del } from "idb-keyval"

// https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient?from=reactQueryV3#building-a-persister
export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
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
