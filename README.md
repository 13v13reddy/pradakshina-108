# Pradakshina

A quiet, iPhone-first companion for 108 pradakshinas.

**[Open the app](https://13v13reddy.github.io/pradakshina-108/)**

## A round, remembered

Choose one spot on your path. When you return after a complete round, hold the large button for 850 milliseconds. One bead lights up and a persistent receipt shows the exact saved time and how long ago it was. A 12-second duplicate guard prevents immediately counting again.

- 108 individual progress beads, with a clear completion state.
- Timestamped round history and JSON download.
- Confirmation before undoing a round or starting over.
- Local progress recovery after closing or refreshing.
- Offline app shell and self-hosted fonts.
- Pause/resume, optional screen wake lock, and an accessible tap mode.
- Keyboard hold with Space or Enter; assistive activation is supported.
- No accounts, analytics, external runtime requests, or backend.

This is a manual counter. It does not detect your location or movement. The visible receipt helps you remember whether you recorded a round; it cannot determine whether you physically completed one.

## Install on iPhone

1. Open the app link in Safari.
2. Open Share (inside the page menu in some Safari versions), then choose **Add to Home Screen**.
3. Enable **Open as Web App** if offered and tap **Add**.
4. Open the home screen app before starting. Wait for **Saved here · ready offline** before going offline.

Some iPhone versions keep Safari and installed app storage separate, so begin your practice in the surface you intend to keep using. Progress belongs to the current browser/device and can be removed if its site data is cleared. Use **Your rounds → Download your rounds** to export a record.

Visual confirmation is the primary feedback on iPhone. Optional browser vibration runs only where supported. Wake lock is optional and may be declined by the phone.

## Development

Node.js 20 or newer. No package dependencies.

```sh
npm test
npm run check
npm run build
npm run dev
```

Open `http://localhost:4173/pradakshina-108/`. The local server also supports the root path. Only `dist/` is deployed; source documentation and tests are excluded. `node scripts/generate-icons.mjs` regenerates the app icons from the geometric mark.

## GitHub Pages

The included GitHub Actions workflow tests the counting model, checks JavaScript syntax, builds the static app, and deploys `dist/` on pushes to `main`. Set the repository’s Pages source to **GitHub Actions**. Asset URLs, manifest scope, and service worker registration are relative, so the app works under the repository path.

When changing cached app assets, update the cache version in `sw.js`. A successful service worker installation precaches the whole app before reporting offline readiness. Practice data stays in local storage, separately from the app cache.

## Assets

Instrument Serif and DM Sans are self-hosted, under their included SIL Open Font Licenses. Interface icons use Lucide paths under the ISC license; see `assets/LUCIDE-LICENSE.txt`. The app mark is original SVG geometry, rasterized locally for installation icons.
