# Pagefreeze

> **Note**\
> This extension is still a work in progress.

_Do you expect most web pages to behave like documents, and get disappointed
when they act too "smart"?_

_Do you get frustrated when websites add modals, ads, and other content after a
few seconds after the page loads, or as you scroll down the page?_

_Do you feel like websites shouldn't be allowed use your computer's idle CPU
without your consent?_

**Pagefreeze can help.** It will:

- Disable any JavaScript that runs not immediately when the page is loaded.
- Remove "fixed" and "sticky" elements that shrink the available viewing space.
- Allow you to easily toggle whether it's enabled for each website.

## Details

- This extension disables most JavaScript timers and event handlers on web
  pages.

  <details>

  - Allowed:
    - Initially-loaded, synchronous code
    - Code triggered by `load` events
    - Code triggered when a `fetch()` or `XMLHttpRequest` completes
  - Blocked (in a way that doesn't cause uncaught errors in the allowed code):
    - `addEventListener` on `window`, `document`, and `Element.prototype`\
      (except `load` events)
    - `setTimeout`, `setInterval`
    - `IntersectionObserver`

  </details>

- This extension also removes `position: fixed` and `position: sticky`.

- Click the extension icon to disable or re-enable it for the current domain.

## Installing

To install and test in Chrome:

1. Go to `chrome://extensions`.
2. At the top-right, make sure **Developer mode** is turned on.
3. Drag the `extension` folder into the tab. The extension is now installed!

Helpful tips:

- Pin the extension to the toolbar. This allows you to quickly toggle whether
  it's enabled for sites.
- Disable the Chrome Web Store version of the extension (if you have it
  installed) to reduce confusion.
- After editing the extension code, click the reload arrow next to the extension
  on the extensions page to load the new code.

## Contributing

This project is set up to be easy to edit. You can directly run the source code
without installing anything or compiling!

If you are contributing PRs or otherwise want to avoid making bugs, this project
has linters (ESLint, Prettier, TypeScript) configured to help make sure code is
error-free and readable.

<details>
<summary>How to set up linters</summary>

- To have these tools automatically check your code before each commit, just run
  `npm install`, `yarn install`, or `pnpm install`.
- You can also set up your editor to check for errors as you type. Follow the
  step above, then install the plugins/extensions for ESLint, Prettier, and
  TypeScript for your editor.
- Note that this project uses TypeScript but not TypeScript syntax. Instead, we
  use JavaScript with JSDoc comments that contain type information. This allows
  us to have TypeScript's type check but without needing to have a compile
  process. TS/JSDoc syntax reference:
  <https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html>

</details>
