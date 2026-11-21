import { Navigate, Route } from "react-router-dom"
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
import { iosTransitionAnimation, popoverEnterAnimation, popoverLeaveAnimation } from "@rdlabo/ionic-theme-ios26"
import { IonReactRouter } from "@ionic/react-router"
import { discOutline, searchOutline, settingsOutline, cogOutline } from "ionicons/icons"
import {
	CollectionPage,
	SearchPage,
	SettingsHomePage,
	SettingsInformationPage,
	CallbackLoginPage,
	SettingsProfilePage,
} from "@/pages"
import { createIDBPersister } from "@/persister"
import { deviceMode, toIonicMode } from "@/theme/deviceTheme"
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

/* iOS 26 theme — injected conditionally when "ios26" mode is active */
import ios26DefaultVars from "@rdlabo/ionic-theme-ios26/dist/css/default-variables.css?inline"
import ios26Theme from "@rdlabo/ionic-theme-ios26/dist/css/ionic-theme-ios26.css?inline"
import ios26DarkAlways from "@rdlabo/ionic-theme-ios26/dist/css/ionic-theme-ios26-dark-always.css?inline"

/* Theme variables */
import "./theme/variables.css"

const ionicMode = toIonicMode(deviceMode)
localStorage.setItem("mode", ionicMode)

document.documentElement.setAttribute("data-theme", deviceMode)

if (deviceMode === "ios26") {
	const existing = document.getElementById("ios26-theme")
	const style = existing instanceof HTMLStyleElement ? existing : document.createElement("style")
	style.id = "ios26-theme"
	style.textContent = [ios26DefaultVars, ios26Theme, ios26DarkAlways].join("\n")

	if (!existing) {
		document.head.appendChild(style)
	}
}

setupIonicReact({
	mode: ionicMode,
	...(deviceMode === "ios26" && {
		navAnimation: iosTransitionAnimation,
		popoverEnter: popoverEnterAnimation,
		popoverLeave: popoverLeaveAnimation,
	}),
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

// Dev-only: periodically poll for service worker updates. Kept at module level so re-registration
// replaces the existing timer instead of stacking another one.
let swUpdateInterval: ReturnType<typeof setInterval> | undefined

const App: React.FC = () => {
	const [{ username, accessToken }] = useAuth()
	// Insp: https://github.com/vite-pwa/vite-plugin-pwa/blob/main/examples/react-router/src/ReloadPrompt.tsx
	const reloadSW = "__RELOAD_SW__"
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(_swUrl, registration) {
			// @ts-expect-error TS isn't aware of the virtual value
			if (reloadSW === "true" && registration) {
				clearInterval(swUpdateInterval)
				swUpdateInterval = setInterval(() => registration.update(), 20000)
			}
		},
		onRegisterError(error) {
			console.error("SW registration error", error)
		},
	})

	return (
		<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
			<IonApp>
				<IonReactRouter>
					<IonTabs>
						<IonRouterOutlet>
							<Route
								path="/collection"
								element={username && accessToken ? <CollectionPage /> : <NotLoggedIn />}
							/>
							<Route path="/search/*" element={username ? <SearchPage /> : <NotLoggedIn />} />
							<Route path="/settings/info" element={<SettingsInformationPage />} />
							<Route path="/settings/profile" element={<SettingsProfilePage />} />
							<Route
								path="/settings"
								element={
									<SettingsHomePage
										hasUpdate={needRefresh}
										onUpdate={() => updateServiceWorker(true)}
									/>
								}
							/>
							<Route path="/callback" element={<CallbackLoginPage />} />
							<Route path="/" element={<Navigate to="/collection" replace />} />
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
