import { appStore } from "@core/domains/app"
import { RequestRoute } from "@core/domains/app/types"
import { requestStore } from "@core/libs/requests/store"
import { windowManager } from "@core/libs/WindowManager"
import { sleep } from "@talismn/util"
import Browser from "webextension-polyfill"

export default class State {
  // Prevents opening two onboarding tabs at once
  #onboardingTabOpening = false

  constructor() {
    // update the icon when any of the request stores change
    requestStore.observable.subscribe(() => this.updateIcon(true))
  }

  public promptLogin(closeOnSuccess: boolean): void {
    windowManager.popupOpen(`?closeOnSuccess=${closeOnSuccess}`)
  }

  private updateIcon(shouldClose?: boolean): void {
    const counts = requestStore.getCounts()
    const signingCount =
      counts.get("eth-send") + counts.get("eth-sign") + counts.get("substrate-sign")

    const todo = {
      networkAddCount: 0,
    }

    const text = counts.get("auth")
      ? "Sites"
      : counts.get("metadata")
      ? "Meta"
      : signingCount
      ? `${signingCount}`
      : todo.networkAddCount
      ? "Network"
      : counts.get("eth-watchasset")
      ? "Assets"
      : counts.get("encrypt")
      ? "Encrypt"
      : counts.get("decrypt")
      ? "Decrypt"
      : ""

    Browser.browserAction.setBadgeText({ text })

    if (shouldClose && text === "") {
      windowManager.popupClose()
    }
  }

  private waitTabLoaded = (tabId: number): Promise<void> => {
    // wait either page to be loaded or a 3 seconds timeout, first to occur wins
    // this is to handle edge cases where page is closed or breaks before loading
    return Promise.race<void>([
      //promise that waits for page to be loaded
      new Promise((resolve) => {
        const handler = (id: number, changeInfo: Browser.Tabs.OnUpdatedChangeInfoType) => {
          if (id !== tabId) return
          if (changeInfo.status === "complete") {
            // dispose of the listener to prevent a memory leak
            Browser.tabs.onUpdated.removeListener(handler)
            resolve()
          }
        }
        Browser.tabs.onUpdated.addListener(handler)
      }),
      // promise for the timeout
      sleep(3000),
    ])
  }

  /**
   * Creates a new tab for a url if it isn't already open, or else focuses the existing tab if it is.
   *
   * @param url: The full url including # path or route that should be used to create the tab if it doesn't exist
   * @param baseUrl: Optional, the base url (eg 'chrome-extension://idgkbaeeleekhpeoakcbpbcncikdhboc/dashboard.html') without the # path
   *
   */
  private async openTabOnce({
    url,
    baseUrl,
    shouldFocus = true,
  }: {
    url: string
    baseUrl?: string
    shouldFocus?: boolean
  }): Promise<Browser.Tabs.Tab> {
    const queryUrl = baseUrl ?? url

    let [tab] = await Browser.tabs.query({ url: queryUrl })

    if (tab) {
      const options: Browser.Tabs.UpdateUpdatePropertiesType = { active: shouldFocus }
      if (url !== tab.url) options.url = url
      const { windowId } = await Browser.tabs.update(tab.id, options)

      if (shouldFocus && windowId) {
        const { focused } = await Browser.windows.get(windowId)
        if (!focused) await Browser.windows.update(windowId, { focused: true })
      }
    } else {
      tab = await Browser.tabs.create({ url })
    }

    // wait for page to be loaded if it isn't
    if (tab.status === "loading") await this.waitTabLoaded(tab.id as number)
    return tab
  }

  public async openOnboarding(route?: string) {
    if (this.#onboardingTabOpening) return
    this.#onboardingTabOpening = true
    const baseUrl = Browser.runtime.getURL(`onboarding.html`)

    const onboarded = await appStore.getIsOnboarded()

    await this.openTabOnce({
      url: `${baseUrl}${route ? `#${route}` : ""}`,
      baseUrl,
      shouldFocus: onboarded,
    })
    this.#onboardingTabOpening = false
  }

  public async openDashboard({ route }: RequestRoute) {
    const baseUrl = Browser.runtime.getURL("dashboard.html")

    await this.openTabOnce({ url: `${baseUrl}#${route}`, baseUrl })

    return true
  }
}
