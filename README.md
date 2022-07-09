# Pagefreeze

> **Note**\
> This extension is still a work in progress.

Do you expect most web pages to behave like documents, and get disappointed when
they try to act too "smart"? Do you get frustrated when websites add new content
after a few seconds, or as you scroll down the page? Do you feel like websites
shouldn't use your computer's idle CPU without your consent?

**Pagefreeze can help.** It will:

- Disable asynchronous JavaScript timers and event handlers.
- Remove "fixed" and "sticky" elements that shrink the available viewing space.
- Allow you to easily toggle whether it's enabled per-site.

## Technical details

This extension disables all JavaScript timers on web pages.

- Allowed:
  - Initially-loaded, synchronous code
  - Code triggered by `load` events
  - Code triggered when a `fetch()` or `XMLHttpRequest` completes
- Blocked (in a way that doesn't cause uncaught errors in the allowed code):
  - `addEventListener` on `window`, `document`, and `Element.prototype`\
    (except `load` events)
  - `setTimeout`, `setInterval`
  - `IntersectionObserver`

This extension also removes `position: fixed` and `position: sticky`.

Click the extension icon to disable or re-enable for the current domain.

## Running and contributing

This project is set up to be as easy as possible to run and edit. The source
code can be run directly, without installing anything or compiling!

How to test in Chrome and other Chromium browsers:

- Go to `chrome://extensions`.
- At the top-right, make sure **Developer mode** is turned on.
- If you have the Chrome Web Store version of the extension installed, you might
  want to turn off temporarily to reduce confusion. You can do that by toggling
  the switch next to it.
- Drag the `extension` folder into the tab.
- The extension is now installed!
- Notes:
  - If you often find yourself needing to toggle whether this extension is
    enabled for sites, It might be helpful pin the extension to the toolbar.
  - On the Extensions page, the extension has a reload (circular arrow) button
    next to it. After modifying extension code, click the reload button to apply
    the changes.

If you are contributing PRs or otherwise want to avoid making bugs, this project
has a linter (ESLint), formatter (Prettier), and typechecker (TypeScript)
configured to make sure that code is as error-free and readable as possible.

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
