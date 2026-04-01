# CMD Builder

A static GitHub Pages tool for building and copying Roblox admin commands.
No backend. No framework. All data lives in JSON files.

## File Structure

```
index.html              ← entry point
css/
  style.css             ← all styles (Aqua Carbon theme)
js/
  app.js                ← initialisation entry point
  nav.js                ← tab/subtab switching, TOC wiring
  state.js              ← shared runtime state
  utils.js              ← copyToClipboard, showToast, buildTOC, gradientStyle
  queue.js              ← global command queue panel
  aethis-panel.js       ← AETHIS queue panel (bottom-right, drag-drop)
  aethis.js             ← AETHIS subtab renderer
  music.js              ← MUSIC subtab renderer
  effects.js            ← EFFECTS subtab renderer
  statuses.js           ← STATUSES tab renderer
  morphs.js             ← MORPHS tab renderer
data/
  aethis.json           ← AETHIS sounds: categories → items { name, audioId, delay }
  music.json            ← Music tracks:  categories → items { name, audioId }
  effects.json          ← SFX:           categories → items { name, audioId, defaults{volume,range,loop} }
  statuses.json         ← Statuses: modeLabels + items { name, sideinfo, subsideinfo }
  morphs.json           ← Morphs:   categories → items { name, description, imageFile, commands[] }
images/
  morphs/
    <category-id>/
      <imageFile>.png   ← morph card images (3:4 aspect ratio recommended)
```

## Deploying to GitHub Pages

1. Push the repo to GitHub.
2. Go to **Settings → Pages**.
3. Set source to `main` branch, root `/`.
4. Done — site will be live at `https://<user>.github.io/<repo>/`.

> The `.nojekyll` file prevents GitHub Pages from treating `_` prefixed files
> as private. This is required for ES module imports to work correctly.

## Adding Content

### Audio (AETHIS / Music / Effects)

Open the relevant `data/*.json` and add entries to a category's `items` array.

**AETHIS item:**
```json
{ "name": "My Sound", "audioId": "1234567890", "delay": 3 }
```
`delay` is the number appended as `delay <n>` between AETHIS plays.

**Effects item:**
```json
{
  "name": "My SFX",
  "audioId": "1234567890",
  "defaults": { "volume": 1.0, "range": 60, "loop": false }
}
```

### Statuses

Add to `data/statuses.json` under `items`. Text supports `{mode}` as a
placeholder — it will be replaced with the mode label (e.g. `[SRS]`) at runtime.
Gradients are `[r, g, b]` arrays.

### Morphs

1. Add an entry to `data/morphs.json`.
2. Place the image at `images/morphs/<category-id>/<imageFile>`.
3. Use `{person}` in commands — the user fills this in via the text input.

```json
{
  "name": "Dragon",
  "description": "A fire-breathing monster.",
  "imageFile": "dragon.png",
  "commands": ["morph dragon {person} large", "setscale {person} 2"]
}
```

## Output Formats

| Section   | Format |
|-----------|--------|
| AETHIS    | `run play <id> & delay <n> play <id> & delay <n> play <id>` |
| Music     | `run play <id>` (added to global queue) |
| Effects   | `run playsound me <id> <loop> <volume> <range>` |
| Statuses  | `run sideinfo <text> <r> <g> <b> <r> <g> <b> & subsideinfo <text> <r> <g> <b> <r> <g> <b>` |
| Morphs    | `run <cmd1> & <cmd2> ...` (copy only — not queued) |
| Queue     | `run <cmd1> & <cmd2> & ...` |
