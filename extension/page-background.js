/**
 * @param {any[]} args
 */
function workerLog(...args) {
  // eslint-disable-next-line no-console
  console.info("Pagefreeze:", ...args);
}

/**
 * @template {any} T
 */
class CachedValue {
  /** @type {T | undefined} */
  value = undefined;

  /** @type {boolean} */
  retrieved = false;

  /**
   * @param {() => Promise<T>} getter
   * @param {(value: T) => Promise<void>} setter
   */
  constructor(getter, setter) {
    this.getter = getter;
    this.setter = setter;
  }

  /**
   * @return {Promise<T>}
   */
  async get(force = false) {
    if (force || !this.retrieved) {
      this.value = await this.getter();
      this.retrieved = true;
    }
    return /** @type {T} */ (this.value);
  }

  /**
   * @param {T} value
   */
  async set(value) {
    this.value = value;
    await this.setter(value);
  }
}

const DisabledDomains = /** @type {CachedValue<Set<string>>} */ (new CachedValue(
  async () => {
    let { disabledDomains } = await chrome.storage.sync.get({
      disabledDomains: [],
    });
    return new Set(disabledDomains);
  },
  async (disabledDomains) => {
    await chrome.storage.sync.set({ disabledDomains: [...disabledDomains] });
  },
));

/**
 * @typedef {{
 *   tabId: number,
 *   url: string,
 *   domain: string,
 *   isDisabled: boolean,
 *   disabledDomains: Awaited<ReturnType<typeof DisabledDomains.get>>
 * }} Context
 */

/**
 * @template {keyof Context} K
 * @typedef {Required<Pick<Context, K>> & Partial<Omit<Context, K>>} PickContext
 */

/**
 * @param {PickContext<"url">} context
 */
function getDomain(context) {
  const { url } = context;
  return new URL(url).origin;
}

/**
 * @param {PickContext<"disabledDomains" | "domain">} context
 */
function getDomainDisabled(context) {
  const { disabledDomains, domain } = context;
  return disabledDomains.has(domain);
}

/**
 * @param {PickContext<"disabledDomains" | "domain">} context
 */
async function toggleDomain(context) {
  const { disabledDomains, domain } = context;

  if (disabledDomains.has(domain)) {
    workerLog("disabledDomains.delete", domain);
    disabledDomains.delete(domain);
  } else {
    workerLog("disabledDomains.add", domain);
    disabledDomains.add(domain);
  }

  await DisabledDomains.set(disabledDomains);
  return disabledDomains.has(domain);
}

/**
 * @param {Pick<Context, "tabId" | "isDisabled">} context
 */
async function updateBadge({ tabId, isDisabled }) {
  if (isDisabled) {
    await chrome.action.setBadgeText({ tabId, text: "▶ JS" });
  } else {
    await chrome.action.setBadgeText({ tabId, text: "" });
  }
}

/**
 * When the extension button is clicked, toggle whether the extension is
 * disabled for this domain.
 */
chrome.action.onClicked.addListener(async (tab) => {
  let { id: tabId, url } = tab;
  if (tabId == null || url == null) return;

  let domain = getDomain({ url });
  let disabledDomains = await DisabledDomains.get();
  let isDisabled = await toggleDomain({ disabledDomains, domain });
  await updateBadge({ isDisabled, tabId });
});

/**
 * When switching tabs, update the badge.
 */
chrome.tabs.onActivated.addListener(async (details) => {
  let tab = await chrome.tabs.get(details.tabId);
  let { id: tabId, url } = tab;
  if (tabId == null || url == null) return;

  let domain = getDomain({ url });
  let disabledDomains = await DisabledDomains.get();
  let isDisabled = getDomainDisabled({ disabledDomains, domain });
  await updateBadge({ isDisabled, tabId });
});

/**
 * @type {Record<number, string>}
 */
const tabUrlCache = {};

/**
 * When navigating to a new page, update the badge.
 *
 * Also, check the extension is disabled for the current domain. If it is not,
 * inject code to prevent any JS event listeners from being attached.
 */
chrome.webNavigation.onCommitted.addListener(async (details) => {
  let { url, tabId, frameId } = details;
  if (frameId === 0) {
    tabUrlCache[tabId] = url;
  } else {
    url = tabUrlCache[tabId];
  }
  if (url == null) return;

  let domain = getDomain({ url });
  let disabledDomains = await DisabledDomains.get();
  let isDisabled = getDomainDisabled({ disabledDomains, domain });
  if (details.frameId === 0) {
    updateBadge({ isDisabled, tabId });
    chrome.scripting.insertCSS({
      target: { tabId },
      origin: "USER",
      css: "iframe { display: none !important; }",
    });
  }
  workerLog({ tabId, frameId, isDisabled });
  if (isDisabled) return;

  chrome.scripting.executeScript(
    {
      target: { tabId, frameIds: [frameId] },
      // @ts-expect-error: This property hasn't been added to @types/chrome.
      injectImmediately: true,
      world: "MAIN",
      func: () => {
        /**
         * @param {any[]} args
         */
        function pageLog(...args) {
          // eslint-disable-next-line no-console
          console.info("Pagefreeze:", ...args);
        }

        document.addEventListener("DOMContentLoaded", () => {
          let okPositions = new Set(["static", "relative", "absolute"]);
          for (let el of document.querySelectorAll("*")) {
            if (!(el instanceof HTMLElement)) continue;

            if (el instanceof HTMLImageElement) {
              if (el.src === "" && el.dataset.src != null) {
                el.src = el.dataset.src;
                el.removeAttribute("data-src");
              }
            }

            let { position } = window.getComputedStyle(el);
            if (!okPositions.has(position)) {
              if (position === "fixed") {
                el.style.setProperty("position", "absolute", "important");
              } else {
                el.style.setProperty("position", "relative", "important");
              }
            }
          }
        });

        /**
         * @param {Record<string, any>} obj
         * @param {string} objName
         * @param {Record<string, any>} methodMap
         */
        function assignDummyMethods(obj, objName, methodMap) {
          for (let [key, value] of Object.entries(methodMap)) {
            // eslint-disable-next-line no-param-reassign
            // obj[key] = undefined;
            obj[key] = (/** @type {any} */ ...args) => {
              // pageLog(`Prevented ${objName}.${key}`);
              // console.trace();
              if (typeof value === "function") {
                return value(...args);
              } else {
                return value;
              }
            };
          }
        }

        assignDummyMethods(window, "window", {
          addEventListener: undefined,
          setTimeout: undefined,
          setInterval: undefined,
          // fetch: Promise.reject("Pagefreeze: fetch prevented"),
          // fetch: Promise.resolve({}),
        });

        let documentCreateElement = document.createElement;
        assignDummyMethods(window.document, "document", {
          createElement: (/** @type {string} */ name) => {
            if (name.toLowerCase() === "script") {
              return document.createElement("template");
            } else {
              return documentCreateElement.call(document, name);
            }
          },
          addEventListener: undefined,
        });

        assignDummyMethods(Element.prototype, "Element.prototype", {
          addEventListener: undefined,
        });

        XMLHttpRequest.constructor = function() {
          pageLog("XMLHttpRequest");
          assignDummyMethods(this, "XMLHttpRequest", {
            open: undefined,
            setRequestHeader: undefined,
            send: undefined,
            addEventListener: undefined,
          });
        };

        IntersectionObserver.constructor = function() {
          pageLog("IntersectionObserver");
          assignDummyMethods(this, "XMLHttpRequest", {
            observe: undefined,
            unobserve: undefined,
            disconnect: undefined,
          });
        };

        return 1;
      },
    },
    (...results) => {
      // log(222222222222222, results);
    },
  );
});
