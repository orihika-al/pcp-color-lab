# PCP Color Lab

Buildless browser-local DPD photo analysis, GitHub Pages main/root.

## Original photo calibration (2026-11-11)

Replaces the temporary montage-based calibration. User assigned IMG_3868.JPG = 0.2 ppm, IMG_3867.JPG = 0.6 ppm, IMG_3866.JPG = 2.0 ppm. Each original is 4032x3024. Browser decode and sRGB canvas resize to 1600x1200 (same display() pipeline) produce the reference RGB medians. `calibration.js` records source names, sampled ROIs and saturation fractions. Neither photos nor the private QA page are deployed. Filenames are provenance only; no file identity/ordinal determines concentration.

`liquid.js` detects vertical pink regions, falls back to a weaker-pink threshold when no candidate is found, rejects narrow glass-edge strips, and searches the upper liquid body for a uniform bright ROI with penalties for clipping and channel saturation. The user can move/resize any ROI. Median RGB is normalized to its maximum and projected onto the piecewise-linear reference curve. Values outside 0.2–2.0 ppm and colors with normalized RGB distance >12 are rejected. Thresholds are heuristic. This is a fit to three user-assigned photos, not accuracy validation on independent samples. Exposure, illumination color, container, camera/profile and browser rendering can affect readings. Some red saturation remains in the high-concentration photo and is reported in the UI.

All photos are processed locally, with no upload or persistence. Update `sw.js`, `index.html`, `update.html` version markers together. The update page probes the current static shell, removes only this app's old cache/registration and navigates to the new shell. App assets are cached for offline operation.
