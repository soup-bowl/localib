export { splitRecordsByYear, splitRecordsByLabel, splitRecordsByArtist } from "./collectionSort"
export { findLocalImageById } from "./search"

/**
 * Formats a number of bytes as a human-readable string, with the size unit automatically selected based on the size of the number.
 *
 * Copied from https://github.com/soup-bowl/libwhatsthis/blob/main/src/string/index.ts
 *
 * @param bytes - The number of bytes to format.
 * @param decimals - The number of decimal places to include in the formatted string. Defaults to 2.
 * @returns A human-readable string representing the given number of bytes.
 *
 * @example
 * const fileSize = formatBytes(1024);
 * console.log(fileSize); // '1.00 KB'
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
	if (bytes === 0) return "0 Bytes"

	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}
