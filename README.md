# Morph — The Ultimate Offline File Converter

Morph is a privacy-first, 100% offline file converter. Every conversion — video, images, documents — runs entirely in your browser via WebAssembly and Canvas engines. No uploads, no servers, no trackers. Your files never leave your device.

## Tools

| Category | Tools |
| --- | --- |
| **Video** | Convert (MP4/MOV/MKV), Compress (CRF-based), Extract audio (MP3/WAV/M4A/OGG/FLAC) — powered by self-hosted ffmpeg.wasm |
| **Image** | Convert (PNG/JPEG/WEBP/AVIF), Compress, Resize, Crop (interactive), Background remove (scaffold) |
| **Documents** | Image→PDF, PDF→Image, DOCX→PDF, PDF→DOCX (text extraction), Merge, Split (ranges), Rotate |

Every tool is real and wired up — there are no placeholder pages. The single exception is Background remove, which is scaffolded with its UI in place and clearly badged as coming soon.

## How it works

- **Everything is client-side.** Engines are browser libraries loaded lazily when a tool runs: ffmpeg.wasm for video, Canvas/OffscreenCanvas for images, pdf-lib + pdf.js + mammoth + jsPDF + docx for documents. There is no conversion server anywhere.
- **One registry, every surface.** `src/lib/tools.ts` is the single source of truth for the 15 tools; the hub, category pages and sidebar all render from it, so nothing can go out of sync.
- **Self-hosted wasm.** The ffmpeg cores (single- and multi-threaded) live in `public/ffmpeg/` — nothing is fetched from a CDN, keeping the offline promise. The app automatically uses the multi-threaded core when the page is cross-origin isolated (COOP/COEP headers are set in `next.config.ts`).
- **Sequential step cards.** While a run is in flight you see each stage as its own card — Reading file → Loaded → Converting/Compressing/Merging… → Complete — with the active step carrying a 0–100% bar normalized within that step.
- **Honest about limits.** PDF→DOCX is best-effort text extraction; layout, images and tables are not preserved, and the UI says so before you run it. Video outputs are MP4/MOV/MKV: WebM is input-only because the wasm core's libvpx encoder crashes (see `src/lib/engines/video.ts`); VP8/VP9 *decoding* works, so WebM files convert to any output.
- **Crash-hardened engine.** ffmpeg.wasm execs are wrapped in `src/lib/engines/ffmpeg.ts`: a worker crash or a hang (inactivity watchdog) surfaces as a readable error and terminates the poisoned worker, so the next run starts from a fresh core instead of spinning forever.

## Install as an app

Morph is an installable PWA. On desktop, use the install icon in the address bar or the Install button; on iPhone, use Safari's Share → **Add to Home Screen** (iOS has no install prompt, so Morph shows a step-by-step guide there). Once installed, it works fully offline — the service worker (`public/sw.js`) caches the app shell, the wasm cores and the icons.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 + shadcn/ui (Base UI primitives)
- ffmpeg.wasm (self-hosted cores, multi-threaded when cross-origin isolated)
- pdf-lib · pdf.js · mammoth · jsPDF + html2canvas · docx
- next-themes for light/dark/system theming

## Getting started

```bash
yarn install
yarn dev        # http://localhost:3000
```

```bash
yarn build      # production build
yarn start      # serve the production build
yarn lint       # eslint
```

## Testing

| Suite | Command | What it covers |
| --- | --- | --- |
| Unit + integration | `yarn test` | format helpers, tool-registry invariants, PDF range parsing; real merge/split/rotate/images→PDF engine runs asserted with pdf-lib |
| E2E | `yarn test:e2e` | every tool page with real file uploads and verified downloads (magic bytes, page counts, zip structure), sequential step cards, the per-step progress bar, landing, hub + search, PWA (manifest, cross-origin isolation, service worker + wasm assets) |

E2E runs against a production build on **port 3100** (so it never collides with a dev server on 3000), one worker at a time because the wasm conversions are CPU-heavy. It uses the system Chromium by default; override with `PLAYWRIGHT_CHROMIUM_PATH`.

Test fixtures live in `tests/fixtures/` and are regenerated with:

```bash
yarn test:fixtures   # rebuilds PDFs/DOCX with the project's own libs; media via ffmpeg if available
```

## Project structure

```
src/
  app/                    # routes: landing, /tools hub, 14 tool pages, manifest
  components/
    tools/                # ToolShell, FileDropzone, ToolWorkspace, ConversionProgress, …
    ui/                   # shadcn/ui components (Base UI primitives)
  lib/
    engines/              # video + audio (ffmpeg.wasm), image (Canvas), pdf, docx
    tools.ts              # the tool registry (single source of truth)
public/
  ffmpeg/                 # self-hosted wasm cores (single- + multi-threaded)
  sw.js                   # service worker (offline + install)
tests/
  unit/  integration/  e2e/  fixtures/
```

## Notes

- The engine progress convention: 0–9 reading the file, 10–19 loaded, 20–99 processing, 100 complete — the step cards derive their state from it.
- DOCX→PDF renders the document via mammoth + html2canvas; theme colors are pinned to plain hex values during capture because html2canvas 1.4.1 cannot parse the modern `oklch()`/`lab()` color functions Tailwind v4 emits.
- Any tool that ever requires the network would surface a visible notice in the UI — currently none do.
