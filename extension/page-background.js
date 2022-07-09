chrome.runtime.onInstalled.addListener(() => {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return;

    console.log(details.frameId, details.tabId);

    console.log(chrome.scripting);
    chrome.scripting.executeScript(
      {
        target: { tabId: details.tabId },
        injectImmediately: true,
        world: "MAIN",
        func: () => {
          // let { addEventListener } = window;

          window.addEventListener =
            // @ts-expect-error
            (type, listener, options) => {
              console.log("Pagefreeze window.addEventListener");
              // console.log("window.addEventListener", type, listener, options);
              // return addEventListener.call(window, type, listener, options);
            };

          // @ts-expect-error
          window.setTimeout = () => {
            console.log("Pagefreeze window.setTimeout");
          };

          // @ts-expect-error
          window.setInterval = () => {
            console.log("Pagefreeze window.setInterval");
          };

          Element.prototype.addEventListener = () => {
            console.log("Pagefreeze Element.prototype.addEventListener");
          };

          window.document.addEventListener = () => {
            console.log("Pagefreeze document.addEventListener");
          };

          // @ts-expect-error
          window.fetch = () => {
            console.log("Pagefreeze fetch");

            return Promise.resolve();
          };

          // @ts-expect-error
          window.XMLHttpRequest = class XMLHttpRequest {
            constructor() {
              console.log("Pagefreeze XMLHttpRequest");
            }

            open() {
              console.log("Pagefreeze XMLHttpRequest.open");
            }

            setRequestHeader() {
              console.log("Pagefreeze XMLHttpRequest.setRequestHeader");
            }

            send() {
              console.log("Pagefreeze XMLHttpRequest.send");
            }

            addEventListener() {
              console.log("Pagefreeze XMLHttpRequest.addEventListener");
            }
          };

          // @ts-expect-error
          window.IntersectionObserver = class IntersectionObserver {
            constructor() {
              console.log("Pagefreeze IntersectionObserver");
            }

            observe() {
              console.log("Pagefreeze IntersectionObserver.observe");
            }

            unobserve() {
              console.log("Pagefreeze IntersectionObserver.unobserve");
            }

            disconnect() {
              console.log("Pagefreeze IntersectionObserver.disconnect");
            }
          };

          // debugger;
          // for (const key of Object.keys(Element.prototype)) {
          //   let oldValue;
          //   try {
          //     oldValue = Element.prototype[key];
          //   } catch (e) {
          //     continue;
          //   }
          //   console.log(key, oldValue);
          //   if (typeof oldValue === "function") {
          //     Element.prototype[key] = function(...args) {
          //       console.log(key, args);
          //       return oldValue.call(this, ...args);
          //     };
          //   }
          // }

          // console.log(1111111111111);
          return 1;
        },
      },
      (...results) => {
        // console.log(222222222222222, results);
      },
    );
  });
  // chrome.contextMenus.create({
  //   id: "sampleContextMenu",
  //   title: "Sample Context Menu",
  //   contexts: ["selection"],
  // });
});

// const tabId = getTabId();
// chrome.scripting.executeScript(
//   {
//     target: { tabId: tabId },
//     files: ["script.js"],
//   },
//   () => {
//     console.log(11111111111);
//   },
// );
