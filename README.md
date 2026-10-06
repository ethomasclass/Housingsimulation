# Folk vs. Popular Housing: a 3D / VR field trip

A narrated 3D experience for AP Human Geography (Unit 3, Cultural Patterns and Processes). Students watch two houses get built step by step, then explore each one inside and out:

| | Folk housing | Popular housing |
|---|---|---|
| House | Gassho-zukuri farmhouse | Levittown ranch house |
| Place | Shirakawa-go, Japan | Levittown, New York, 1949 |
| Built by | The whole village (*yui*) | Specialized crews in 27 assembly-line steps |
| Shaped by | Heavy snow, local grass and timber, silk farming | Mass production, the car, the nuclear family |

The Levittown interior follows the 1949 Levitt ranch sales-brochure floor plan (32′ × 25′): kitchen at the front with the entry, living room with a glass window wall at the back, a central core with the washer, heater and double fireplace, two bedrooms (12′ × 12′ and 8′ × 12′) with closets between, one bath, and stairs to the expansion attic. The 1950 extras (carport and the TV under the stairs) are included and labeled as such.

It runs in any modern browser: Chromebooks, laptops, tablets and phones. On a phone it also works with a **Google Cardboard-style viewer**.

## Putting it on GitHub Pages

1. On GitHub, open the repository and go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose the branch that holds these files (for example `main`) and the **/ (root)** folder, then click **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/<repository-name>/`. Share that link with students.

Everything is plain static files, with no build step, and three.js is bundled in `js/vendor/`, so school networks that block CDNs are fine. GitHub Pages serves over HTTPS, which phones require for the motion sensors used in VR.

Direct links skip the home screen: add `#gassho` or `#levittown` to the end of the URL.

## How students use it

**On a Chromebook or laptop:** walk with the arrow keys or W A S D (↑/↓ or W/S move, ←/→ turn, A/D step sideways, hold Shift to hurry) and drag with the mouse to look around. Walls stop you, and you can step up onto floors and porches. Click the blue rings to jump to a spot and the gold **i** buttons to read and hear more. Use **Pause**, **Next step** or **Skip to the tour** during the build.

**On a phone or tablet:** walk with the joystick in the lower-left corner and drag anywhere else to look, or tap the phone icon to look around by moving the device. Attic floors in the farmhouse are reached with the blue rings at the ladders.

**In Cardboard VR:** choose **Cardboard VR** on the home screen, tap **Start the tour**, turn the phone sideways and slide it into the viewer.
- Look at a ring or an **i** for about two seconds to select it. The viewer's button also works.
- Look down at your feet to open the menu: pause, skip, jump to a spot, switch houses, or exit.
- **Android (Chrome):** uses real WebXR VR. The first time, Chrome may ask you to scan the QR code printed on the viewer. If VR won't start, tick **"Use simple split-screen VR instead"** on the home screen.
- **iPhone (Safari):** uses a split-screen view driven by the motion sensors. Tap **Allow** when asked about motion access. Adding the page to the Home Screen gives a full-screen view.

Narration uses the device's built-in voice, and captions are always available (CC button).

## Editing the narration and facts

All words live in two files, separate from the 3D code:

- `js/houses/gassho.js`: the `text` object (one line per build step) and the `hotspots` list (the gold **i** cards)
- `js/houses/levittown.js`: same layout

Edit the text between the quotes and save. The captions and the spoken narration both update.

### Using your own recorded voice

Any build step or hotspot can play an audio file instead of the computer voice. Put the file in an `audio/` folder and add an `audio` field, for example:

```js
{ title: 'Foundation stones', text: text.stones, audio: 'audio/gassho-02.mp3', anims: ... }
```

If the file is missing or can't play, it falls back to the computer voice automatically. Keep the `text` matching the recording, because it is still shown as the caption.

## Running it locally

Browsers won't load the modules from `file://`, so serve the folder:

```sh
python3 -m http.server 8080
# then open http://localhost:8080
```

## Project layout

```
index.html            page, home screen and on-screen controls
css/style.css         styles
js/main.js            home screen + button wiring, starting screen/VR modes
js/engine/app.js      renderer, camera, look controls, VR, gaze selection, teleporting
js/engine/timeline.js plays the narrated build steps
js/engine/narrator.js text-to-speech / recorded audio
js/engine/kit.js      shapes, materials and procedural textures
js/engine/ui3d.js     in-VR panels, rings, info buttons, reticle
js/houses/*.js        the two houses: geometry, build steps, viewpoints, text
js/vendor/            three.js r170 (MIT license)
```

The houses are stylized, low-poly models built in code (no downloaded 3D assets), so the project has no image or model licensing to worry about.
