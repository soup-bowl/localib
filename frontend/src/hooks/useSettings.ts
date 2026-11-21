import { useCallback, useMemo, useSyncExternalStore } from "react"
import { parseStored, readRaw, removeStored, subscribeToStore, writeStored } from "@/utils/localStore"

const useSettings = <T>(key: string, defaultValue: T): [T, (value: T) => void, () => void] => {
	// Snapshot is the raw string, which is stable between renders until the value actually changes.
	const raw = useSyncExternalStore(subscribeToStore, () => readRaw(key))
	const setting = useMemo(() => parseStored<T>(raw) ?? defaultValue, [raw, defaultValue])

	const saveSetting = useCallback((value: T) => writeStored(key, value), [key])
	const clearSetting = useCallback(() => removeStored(key), [key])

	return [setting, saveSetting, clearSetting]
}

export default useSettings
