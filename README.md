# ACME Car Pre-Inspection — prototype

End-to-end, clickable prototypes of the Figma file "Anaira-Pre-Inspection". The root page lists every version;
each version is a self-contained app in its own folder (`v1/` = section "ACME - V1", `v2/` = section "✅ Anaira - V2", the Anaira redesign).
Live camera, real photo captures, real video recordings (with audio), real permission prompts and voice-over.

## Try it on a phone (camera needs HTTPS)
1. Go to https://app.netlify.com/drop and drag this folder onto the page (free, no setup).
   Any static HTTPS host works too (Vercel, GitHub Pages, S3).
2. Open the link it gives you on your phone in Chrome or Safari, and allow camera, microphone and location.
3. Turn the volume up: each step is narrated.

On a laptop, open the same link to see the flow inside a phone frame (the webcam stands in for the phone camera).

## Useful links (inside a version, e.g. `v1/`)
- `#/__index` lists every screen and state, for jumping straight to one during design review.
- The Inspection Items screen (after WhatsApp) picks which optional captures run (windshield, rooftop, VIN, engine sound); the bonnet is only opened for engine sound.
- `?optional=0` starts with every optional item unticked.
- `#/review?state=failed` (or `uploading`, `recapture`, `reuploading`, `uploaded`) freezes Review in a state.
- Upload is simulated (no backend). Switch on airplane mode during upload to see the real failure path.
- Photos that are too dark or blurry are flagged for retake/recapture by an on-device check.

## Structure
`index.html` (redirects to `v2/`) · per version: `vN/index.html` → `js/core.js` (router, camera, recording, voice-over), `js/components.js` (shared UI),
`js/screens/*.js` + `css/screens/*.css` (one file per flow stage), `assets/` (exported from Figma).
