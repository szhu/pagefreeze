/**
 * @param {any[]} args
 */
function workerLog(...args) {
  // eslint-disable-next-line no-console
  console.info("Pagefreeze:", ...args);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return;

    {
      let { tabId, frameId } = details;
      workerLog("chrome.webNavigation.onCommitted", { tabId, frameId });
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
            fetch: Promise.resolve(),
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
