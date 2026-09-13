# IINA (Raycast extension)

Play a URL or file in [IINA](https://iina.io) straight from Raycast — no window, no follow-up
step.

## Usage

1. `npm install`
2. `npm run dev` to load the extension into Raycast (keep it running, or `npm run build` for a
   persistent local build).
3. In Raycast, open **Play in IINA**, press <kbd>Tab</kbd>, paste a URL or file path, then
   <kbd>Enter</kbd>. IINA launches and starts playing immediately.
4. Leave the argument empty to play whatever is currently on the clipboard.

### Set up the one-shot alias

For the `[alias] [link] ⏎` flow: open Raycast ▸ Extensions ▸ **IINA** ▸ **Play in IINA**, and
set a **Alias** (e.g. `iina`) and optionally a hotkey. After that, typing `iina`, pressing
<kbd>Tab</kbd>, pasting a link, and hitting <kbd>Enter</kbd> plays it — all inline, no view ever
opens.

## How it works

The command shells out to IINA's bundled `iina-cli` binary
(`/Applications/IINA.app/Contents/MacOS/iina-cli`) with the URL passed as a plain argument
(no shell involved), so query strings like `?api_key=...` are passed through untouched.

## Preferences

- **IINA Application** — path to the IINA app, if not installed at the default location.
- **Open in a new window** — open each link in its own IINA window instead of reusing the
  current one.
- **Start in music mode** — passes `--music-mode` to `iina-cli`.
- **Extra iina-cli Arguments** — any additional flags, e.g. `--mpv-volume=80`.
