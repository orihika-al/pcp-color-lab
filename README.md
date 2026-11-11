# PCP Color Lab

Buildless browser-local DPD liquid photo analysis; GitHub Pages main/root.

## 2026-11-11: user-assigned three-point liquid calibration

The user supplied a 443x110 composite and assigned left/centre/right values of 0.2, 0.6, 2.0 ppm. This is an image-reference fit, not independent validation of concentration. The original photograph is not included in the public app. `calibration.js` records RGB medians, source ROIs, and saturation fractions. The unchanged private draft from the earlier photo-card comparison task remains separate.

`liquid.js` detects connected pink regions with vertical aspect ratio, searches the upper body for a uniform bright patch, and excludes near-white/near-black pixels. The source image is reduced only above 1600 px. Multiple candidates are presented left-to-right; all ROIs are manually adjustable. No image identity, filename, hash, or ordinal selects a concentration. ROI color alone determines the result.

Median sRGB is divided by its maximum channel and scaled to 255; three reference vectors are linked by piecewise-linear segments. Nearest-segment projection determines interpolation. Outside endpoints and normalized RGB distance >12 are rejected. The distance threshold is heuristic, not an accuracy bound. A sample needs at least 9 valid pixels, less than 25% white/black clipping and median RGB spread <35. Red-channel saturation is retained (also present in two calibration photos) but visibly flagged. This limits generalization.

Photos are processed only in the browser. No user photo is sent or persisted. UI shows reference values, saturation/low-resolution limitations, and unvalidated accuracy. The synthetic demo uses the middle reference color.

Bump the shell marker and service worker VERSION together on every deployment. All app files, including liquid.js, are pre-cached for offline use. `update.html` clears this app's old cache and returns to the app.
