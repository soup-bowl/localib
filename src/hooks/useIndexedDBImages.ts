import { useCallback } from "react"
import { set, get } from "idb-keyval"

const useIndexedDBImages = () => {
	const saveImage = useCallback(async (id: string, imageUrl: string) => {
		try {
			const existingImage = await get(id)
			if (existingImage) {
				console.log("Image already exists, skipping fetch and save.")
				return
			}

			const adjustUrl = imageUrl.replace(/https:\/\/i\.discogs\.com\//g, "https://dcdn.subo.dev/")
			const response = await fetch(adjustUrl)
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
			}

			const contentType = response.headers.get("Content-Type")
			if (!contentType || !contentType.includes("image/jpeg")) {
				throw new Error("The fetched item is not a JPEG image")
			}

			const blob = await response.blob()
			const base64Data = await blobToBase64(blob)

			await set(`sbImageCache${id}`, base64Data)
		} catch (error) {
			console.error("Error saving image:", error)
		}
	}, [])

	const getImage = useCallback(async (id: string): Promise<string | undefined> => {
		try {
			const base64Data = await get(`sbImageCache${id}`)
			if (!base64Data) {
				return undefined
			}
			return base64Data
		} catch (error) {
			console.error("Error getting image:", error)
			return undefined
		}
	}, [])

	const blobToBase64 = (blob: Blob): Promise<string> => {
		return new Promise<string>((resolve, reject) => {
			const reader = new FileReader()
			reader.readAsDataURL(blob)
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = (error) => reject(error)
		})
	}

	return {
		saveImage,
		getImage,
	}
}

export default useIndexedDBImages
