import { IReleases } from "@/api"

export type IReleasesSort = {
	[group: string]: IReleases[]
}

export type IReleaseTuple = [string, IReleases[]][]

export type DeviceMode = "ios" | "ios26" | "md"
