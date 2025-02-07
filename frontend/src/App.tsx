import { Redirect, Route } from "react-router-dom"
import { useRegisterSW } from "virtual:pwa-register/react"
import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import {
	IonApp,
	IonBadge,
	IonContent,
	IonIcon,
	IonLabel,
	IonPage,
	IonRouterOutlet,
	IonTabBar,
	IonTabButton,
	IonTabs,
	setupIonicReact,
} from "@ionic/react"
import { IonReactRouter } from "@ionic/react-router"
import { discOutline, searchOutline, settingsOutline, cogOutline } from "ionicons/icons"
import { CollectionPage, SettingsLoginPage, SearchPage, SettingsHomePage, SettingsStatsPage } from "@/pages"
import { createIDBPersister } from "@/persister"
import { DeviceMode } from "@/types"
import { useAuth } from "@/hooks"
import { FullpageInfo } from "@/components"

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css"

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css"
import "@ionic/react/css/structure.css"
import "@ionic/react/css/typography.css"

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css"
import "@ionic/react/css/float-elements.css"
import "@ionic/react/css/text-alignment.css"
import "@ionic/react/css/text-transformation.css"
import "@ionic/react/css/flex-utils.css"
import "@ionic/react/css/display.css"

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

import "@ionic/react/css/palettes/dark.always.css"
// import '@ionic/react/css/palettes/dark.class.css';
// import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import "./theme/variables.css"

const getDeviceMode = (): DeviceMode => {
	const item = localStorage.getItem("DeviceTheme")
	const parsedItem = item ? JSON.parse(item) : "ios"
	const validItem = parsedItem ? (parsedItem as DeviceMode) : "ios"
	localStorage.setItem("mode", validItem)
	return validItem
}

setupIonicReact({
	mode: getDeviceMode(),
})

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: Infinity,
		},
	},
})

const persister = createIDBPersister()

const NotLoggedIn: React.FC = () => (
	<IonPage>
		<IonContent fullscreen>
			<FullpageInfo text="You are not logged in." />
		</IonContent>
	</IonPage>
)

const App: React.FC = () => {
	const [{ username, token }] = useAuth()
	// Insp: https://github.com/vite-pwa/vite-plugin-pwa/blob/main/examples/react-router/src/ReloadPrompt.tsx
	const reloadSW = "__RELOAD_SW__"
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(swUrl, r) {
			console.log(`Service Worker at: ${swUrl}`)
			// @ts-expect-error TS isn't aware of the virtual value
			if (reloadSW === "true") {
				r &&
					setInterval(() => {
						console.log("Checking for sw update")
						r.update()
					}, 20000)
			} else {
				// eslint-disable-next-line prefer-template
				console.log("SW Registered: " + r)
			}
		},
		onRegisterError(error) {
			console.log("SW registration error", error)
		},
	})

	return (
		<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
			<IonApp>
				<IonReactRouter>
					<IonTabs>
						<IonRouterOutlet>
							<Route exact path="/collection">
								{username && token ? <CollectionPage /> : <NotLoggedIn />}
							</Route>
							<Route path="/search">{username ? <SearchPage /> : <NotLoggedIn />}</Route>
							<Route exact path="/settings/login">
								<SettingsLoginPage />
							</Route>
							<Route exact path="/settings/stats">
								<SettingsStatsPage />
							</Route>
							<Route exact path="/settings">
								<SettingsHomePage hasUpdate={needRefresh} onUpdate={() => updateServiceWorker(true)} />
							</Route>
							<Route exact path="/">
								<Redirect to="/collection" />
							</Route>
						</IonRouterOutlet>
						<IonTabBar slot="bottom" translucent>
							<IonTabButton tab="collection" href="/collection">
								<IonIcon aria-hidden="true" icon={discOutline} />
								<IonLabel>Collection</IonLabel>
							</IonTabButton>
							<IonTabButton tab="search" href="/search">
								<IonIcon aria-hidden="true" icon={searchOutline} />
								<IonLabel>Search</IonLabel>
							</IonTabButton>
							<IonTabButton tab="settings" href="/settings">
								<IonIcon aria-hidden="true" ios={cogOutline} md={settingsOutline} />
								<IonLabel>Settings</IonLabel>
								{needRefresh && <IonBadge>!</IonBadge>}
							</IonTabButton>
						</IonTabBar>
					</IonTabs>
				</IonReactRouter>
			</IonApp>
		</PersistQueryClientProvider>
	)
}

export default App
