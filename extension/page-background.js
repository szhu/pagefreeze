/**
 * @param {any[]} args
 */
function workerLog(...args) {
  // eslint-disable-next-line no-console
  console.info("Pagefreeze:", ...args);
}

class ExtStorage {
  /**
   * @param {chrome.storage.StorageArea} area
   */
  constructor(area) {
    this.area = area;
    /** @type {Record<string, any>} */
    this.cache = {};
  }

  /**
   * @param {Record<string, any>} keyMapping
   */
  get(keyMapping) {
    let result = { ...keyMapping };
    for (let key of Object.keys(keyMapping)) {
      if (key in this.cache) {
        result[key] = this.cache[key];
      }
    }
    return result;
  }

  /**
   * @template {{[key: string]: any}} T
   * @param {T} keyMapping
   */
  async load(keyMapping) {
    let result = await this.area.get(keyMapping);
    this.cache = { ...this.cache, ...result };
    return /** @type {T} */ (result);
  }

  /**
   * @param {Record<string, any>} keyMapping
   */
  async save(keyMapping) {
    this.cache = { ...this.cache, ...keyMapping };
    await this.area.set(keyMapping);
  }
}

const SyncStorage = new ExtStorage(chrome.storage.sync);
workerLog(SyncStorage);

async function toggleDomain(domain) {
  let old = await SyncStorage.load({
    disabledDomains: /** @type {string[]} */ ([]),
  });
  let disabledDomains = new Set(old.disabledDomains);
  console.log(disabledDomains);

  if (disabledDomains.has(domain)) {
    workerLog("disabledDomains.delete", domain);
    disabledDomains.delete(domain);
  } else {
    workerLog("disabledDomains.add", domain);
    disabledDomains.add(domain);
  }

  await SyncStorage.save({ disabledDomains: [...disabledDomains] });
}

/**
 * @param {number} tabId
 * @param {string } url
 */
function updateBadge(tabId, url) {
  let domain = new URL(url).origin;
  if (SyncStorage.cache.disabledDomains.includes(domain)) {
    chrome.action.setBadgeText({ tabId, text: "▶ JS" });
  } else {
    chrome.action.setBadgeText({ tabId, text: "" });
    // chrome.action.setBadgeBackgroundColor({ tabId, color: "transparent" });
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id == null) return;
  if (tab.url == null) return;

  let domain = new URL(tab.url).origin;
  await toggleDomain(domain);
  updateBadge(tab.id, tab.url);
});

chrome.runtime.onInstalled.addListener(() => {
  SyncStorage.load({
    disabledDomains: /** @type {string[]} */ ([]),
  });

  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return;

    {
      let { tabId, frameId } = details;
      workerLog("chrome.webNavigation.onCommitted", { tabId, frameId });

      updateBadge(details.tabId, details.url);
      let domain = new URL(details.url).origin;
      workerLog(
        "Disabled for origin",
        domain,
        SyncStorage.cache.disabledDomains.includes(domain),
      );
      if (SyncStorage.cache.disabledDomains.includes(domain)) {
        return;
      }
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: details.tabId },
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

          /**
           * @param {Record<string, any>} obj
           * @param {string} objName
           * @param {Record<string, any>} methodMap
           */
          function assignDummyMethods(obj, objName, methodMap) {
            for (let [key, value] of Object.entries(methodMap)) {
              // eslint-disable-next-line no-param-reassign
              obj[key] = () => {
                pageLog(`Prevented ${objName}.${key}`);
                return value;
              };
            }
          }

          assignDummyMethods(window, "window", {
            addEventListener: undefined,
            setTimeout: undefined,
            setInterval: undefined,
            fetch: Promise.reject(),
          });

          assignDummyMethods(window.document, "document", {
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
});
