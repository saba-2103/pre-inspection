# ACME Car Pre-Inspection prototype

Clickable, pixel-faithful prototype of the Figma file `y3dQbyV1svoVUalmewQvgF` (Anaira-Pre-Inspection), section `2:1323` "ACME - V1".
Plain static site: no build step, no framework, no package.json. Open `index.html` through any HTTPS host.

## Deploy
- Vercel: `npx vercel --prod` from this folder (static site; accept defaults, no framework, no build command, output dir `.`).
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
- `#/__index` lists all screens; `?optional=0` = mandatory-only flow; `?frame=1` forces the desktop phone frame.
- Upload is simulated (no backend).

## Open design copy issues (in Figma, not fixed here)
- RC Type VO says "Tap 'Start Inspection'" but the button says "Continue".
- Damages capture badge says "Fit the Odometer Reading…"; Windshield recording badge says "Windshield Reading".
