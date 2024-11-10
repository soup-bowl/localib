import { IReleases } from "@/api"

export type IReleasesSort = {
	[group: string]: IReleases[]
}

export type IReleaseTuple = [string, IReleases[]][]

export type IStatDisplay = {
	icon: string
	value?: number
	label: string
}

export type DeviceMode = "ios" | "md"
