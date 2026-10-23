# ACME Car Pre-Inspection prototype

Clickable, pixel-faithful prototypes of the Figma file `y3dQbyV1svoVUalmewQvgF` (Anaira-Pre-Inspection).
Plain static site: no build step, no framework, no package.json. Open `index.html` through any HTTPS host.

## Versions
- Root `index.html` redirects to `v2/` (the default flow); V1 stays at `/v1/`. Pull to refresh restarts the current version.
- Each version is a self-contained app in its own folder (`v1/`, `v2/`, …) with its own `index.html`, `js/`, `css/`, `assets/`; all paths relative.
- `v1/` = section `2:1323` "ACME - V1". Paths below are relative to a version folder (V1 layout).
- `v2/` = Figma section "✅ Anaira - V2" (669:30753, page 669:30752), Anaira brand. Own runtime based on V1's: `js/core.js` (router + counter-rotation layout with the "Please rotate your phone" prompt, VO with playback ring on the voice button, camera live checks/auto torch/zoom/sample stills, background uploads with fail/retry), `js/ui.js` (logo, `U.page`/`U.sheet`/`U.lmodal`, stepper header `U.camNav`, camera `U.cam`/`U.mountCam` with 3-2-1 countdown recorder, review panel `U.verdict`, `U.fullscreen`), `js/flow.js` (Stage 1/2 item lists, stepper labels, routing; loaded before screens), `js/screens/s0–s3` (`U.photoStep`/`U.videoStep` in s1, reused by s2). Assets: `assets/ui` icons, `img` illustrations + camera sample stills, `cam2` stepper/orbit, `walk` 360° stills, `wa` WhatsApp. Capture instruction modals show unless the hash has `?ready=1` (`App.markReady()` on Got it pushes that history step, so Back from the camera reopens the modal; retakes go to `<id>?ready=1`). `?fast=1` = 3 s video minimum; `#/review?state=uploading|attention|failed|good` = sample review.

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
- Desktop phone frame: `device-frame.js` (root, shared by V1 and V2) adds a device picker top-left (Chrome DevTools sizes); the choice is kept in localStorage (`pi-device`) and drives the framed stage size and the device chrome (`html[data-os]`: iOS status bar + Dynamic Island + Safari, or Android status bar + Chrome; builders `DeviceFrame.time/statusIcons/safari`).
- Upload is simulated (no backend).

## Open design copy issues (in Figma, not fixed here)
- Damages capture badge says "Fit the Odometer Reading…"; Windshield recording badge says "Windshield Reading".
