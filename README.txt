FLAPPY BIRD ARCADE EDITION

WEB TEST:
1. Open index.html in Firefox, or serve this folder from localhost.
2. For offline/PWA support, use localhost or HTTPS (service workers do not work from file://).
3. On Android, open the hosted HTTPS site in Chrome and choose Install app / Add to Home screen.

MAC APP:
This project includes an Electron wrapper. Install Node.js, then in Terminal:
npm install
npm start

To package a Mac app:
npm run build:mac

The Electron version is pinned for older macOS compatibility. Packaging requires internet access for npm downloads.

PROGRESS:
Coins, best score, total pipes, unlocked skins and equipped skin save locally on each device.
There is no cross-device synchronization.

LIMITED EDITIONS:
The shop includes seasonal-themed skins. These are included locally; they are not globally timed or server-controlled.

CONTROLS:
Space, Up Arrow, mouse click or touch to flap.
