# ACME Car Pre-Inspection prototype

Clickable, pixel-faithful prototypes of the Figma file `y3dQbyV1svoVUalmewQvgF` (Anaira-Pre-Inspection).
Plain static site: no build step, no framework, no package.json. Open `index.html` through any HTTPS host.

## Versions
- Root `index.html` is the launcher: a card per version (`VERSIONS` array in the page). Add a version = new folder + one array entry.
- Each version is a self-contained app in its own folder (`v1/`, `v2/`, …) with its own `index.html`, `js/`, `css/`, `assets/`; all paths relative.
- `v1/` = section `2:1323` "ACME - V1". Paths below are relative to a version folder (V1 layout).
- `v2/` = Figma page "V2" (648:21081), from the "UX Audit & Redesign" page (612:21081). Own runtime based on V1's: `js/core.js` (router + counter-rotation layout, captions, camera live checks/torch/sample stills, background uploads), `js/ui.js` (camera chrome `U.cam`/`U.mountCam`, `U.photoItem`/`U.videoItem`, verdict, toast), `js/flow.js` (item lists, progress counts, routing; loaded before screens), `js/screens/s0–s3`. `?fast=1` = 3 s video minimum for testing; `#/review?state=attention|good` = sample review.

## Deploy
- Pushing `main` to GitHub (saba-2103/pre-inspection) auto-deploys on Vercel. Manual: `npx vercel --prod` from this folder (static site; accept defaults, no framework, no build command, output dir `.`).
- Camera, microphone and location need HTTPS (or localhost). Local test: `npx serve .` then open http://localhost:3000.

## Structure
- `js/core.js` — router (hash routes `#/<screen-id>`), stage scaling, state, voice-over (speechSynthesis), camera (getUserMedia), recording (MediaRecorder), photo quality check, permissions.
- `js/components.js` — shared UI builders (`C.header`, `C.steps`, `C.footer`, `C.captureScreen` + `C.mountCapture`, `C.capturedScreen`, `C.fsScreen`).
- `js/screens/<a-f>-*.js` + `css/screens/<a-f>-*.css` — one pair per flow stage: a onboarding, b permissions/instructions/rotate prompts, c RC + odometer photos, d video recordings + VIN, e 360° walkaround + damages, f review/submit.
- `assets/` — exported from Figma (`core/` shared icons, `a`–`f` per stage, `fonts/` self-hosted Poppins/Inter/Montserrat/Roboto).

## Conventions
- Each screen: `App.screen({id, node, title, orientation:'portrait'|'landscape', className, rotate, vo, render(ctx), mount(el, ctx)})`. `node` is the Figma node it implements.
- Navigate with `data-go="id"`; use `data-next="id"` (or `App.go(App.nextAfter(id))`) after a capture so re-captures started from Review return to Review.
- Design sizes: portrait 390×850 (incl. 90px device chrome), landscape 850×390 (incl. 34px status bar). Status bar, browser bar and home bar are `.device-only` (shown in the desktop phone frame only).
- Scope every CSS selector under the screen's class. Use exact Figma values.
- Optional captures (windshield, roof, vin, engine) are picked on the `items` screen → `App.state.items`; check with `C.has(key)`, route with `App.route.*` (js/flow.js), steppers via `C.stageSteps(stage, label)`. Engine Sound is the only reason to open/close the bonnet (bonnet-closed assets otherwise).
- `#/__index` lists all screens; `?optional=0` = all optional items start unticked; `?frame=1` forces the desktop phone frame.
- Upload is simulated (no backend).

## Open design copy issues (in Figma, not fixed here)
- Damages capture badge says "Fit the Odometer Reading…"; Windshield recording badge says "Windshield Reading".
