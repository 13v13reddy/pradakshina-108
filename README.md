# Pradakshina

A quiet, iPhone-first companion for pradakshinas, with 108 rounds as the default.

**[Open the app](https://13v13reddy.github.io/pradakshina-108/)**

## A round, remembered

Choose your round goal, then tap **Start practice** at your chosen spot to save the start time. When you return after a complete round, hold the large button for 850 milliseconds. A persistent receipt shows the exact saved time and how long ago it was. A 12-second duplicate guard prevents immediately counting again. The final round saves the finish time and freezes the total duration.

- Preset goals of 11, 21, 54, and 108, or any custom count from 1 to 9,999.
- Goals can change while keeping completed rounds; a goal cannot be lower than the count already saved.
- Start and finish times, with elapsed/total wall-clock duration, including breaks.
- One progress bead per round up to 108; larger goals use 108 proportional progress marks.
- Timestamped round history and JSON download.
- Confirmation before undoing a round or starting over.
- Local progress recovery after closing or refreshing.
- Offline app shell and self-hosted fonts.
- Pause/resume, optional screen wake lock, and an accessible tap mode.
- Keyboard hold with Space or Enter; assistive activation is supported.
- Double-tap zoom is disabled across the page; pinch-to-zoom remains available.
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

When changing cached app assets, update the cache version in `sw.js` and the matching version query on the HTML CSS/module URLs, the state-module import, and the precache list. The versioned asset URLs let an installed older service worker fetch the new modules together. A successful service worker installation precaches the whole app before reporting offline readiness. Practice data stays in local storage, separately from the app cache.

Earlier saved practices migrate in place without losing receipts. Their original opening time is used as an estimated start and labeled **Opened**; a completed earlier practice uses its last round’s timestamp as the finish. New practices use the explicit **Start practice** time. Resetting starts a fresh timer while keeping the selected goal.

## Assets

Instrument Serif and DM Sans are self-hosted, under their included SIL Open Font Licenses. Interface icons use Lucide paths under the ISC license; see `assets/LUCIDE-LICENSE.txt`. The app mark is original SVG geometry, rasterized locally for installation icons.
