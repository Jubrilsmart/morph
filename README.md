# Morph — The Ultimate Offline File Converter

Morph is a privacy-first, 100% offline file converter. Every conversion — video, images, documents — runs entirely in your browser via WebAssembly and Canvas engines. No uploads, no servers, no trackers.

## Tools

| Category | Tools |
| --- | --- |
| **Video** | Convert (MP4/WebM/MOV/MKV), Compress (CRF-based) — powered by self-hosted ffmpeg.wasm |
| **Image** | Convert (PNG/JPEG/WEBP/AVIF), Compress, Resize, Crop (interactive), Background remove (scaffold) |
| **Documents** | Image↔PDF, DOCX→PDF, PDF→DOCX (text extraction), Merge, Split, Rotate |

## Install as an app

Morph is an installable PWA — on desktop use the install icon in the address bar or the Install button; on iPhone, use Safari's Share → **Add to Home Screen**. Once installed, it works fully offline.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 + shadcn/ui (Base UI primitives)
- ffmpeg.wasm (self-hosted cores, multi-threaded when cross-origin isolated)
- pdf-lib · pdf.js · mammoth · jsPDF · docx
- next-themes for light/dark/system theming

## Getting started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
yarn build   # production build
yarn start   # serve the production build
yarn lint    # eslint
```

## Notes

- The ffmpeg WASM cores live in `public/ffmpeg/` (single- and multi-threaded). The app picks the multi-threaded core automatically when the page is cross-origin isolated (COOP/COEP headers are set in `next.config.ts`).
- `public/sw.js` is the service worker backing offline mode and installs.
- PDF→DOCX is best-effort text extraction; layout, images and tables are not preserved (the UI says so).
