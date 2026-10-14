---
name: case-study-video
description: Turn a use-case document (plus an optional screen recording) into a branded 2-4 minute case study video with ElevenLabs voiceover, music, captions and motion graphics. Builds the brand's DNA (palette, type, logo, motifs, tone) from its website when the brand is new. Use when someone says "/case-study-video", "make a case study video", "turn this use case into a video", "video for this automation", or drops a use-case doc and asks for a video. Runs pre-flight checks before any spend and stops at approval gates.
---

# Case study video

Turns `intake/` files into `out/<name>.mp4` (1920x1080, 30 fps, -16 LUFS) plus `out/captions.srt` and `SCRIPT.md`.

The kit folder is this skill's base directory (`$KIT` below). Projects live in a separate projects folder, never inside the kit. Read `$KIT/README.md` once if anything below is unclear.

## Ground rules

- **Stop at every GATE.** Show the user what the gate lists and wait for an explicit yes. Never spend ElevenLabs credits, and never start the full render, before the gate that allows it.
- **Facts come only from the intake document.** No invented numbers, customers, quotes or features. When the document contradicts itself, ask at GATE 1; never pick silently.
- **Never print, echo or log the ElevenLabs key.** Check it with preflight only. A value that does not start with `sk_` is the key ID, not the key.
- **Privacy:** mockups use placeholder people and data. Crop private details (account names, emails, tokens, client data) out of recordings. Respect "must NOT appear" in INTAKE.md.
- **Environment (Claude Code):** Chrome cannot start inside the Bash sandbox, so run `render.mjs` unsandboxed. Node `fetch` needs `NODE_USE_ENV_PROXY=1` and the allowed domain `api.elevenlabs.io`. Run the full render in the background; it takes about 20 minutes for 3 minutes of video.

## Workflow

### 1. Set up
- New project: `node $KIT/new-project.mjs <projects-folder>/<slug> --title "<title>" [--brand byteit]`, then ask the requester to put the files and the filled `INTAKE.md` in `intake/`. The form lists what to provide.
- One-time per machine: `npm install` in `$KIT`. The key goes in `<projects-folder>/.env` as `ELEVENLABS_API_KEY=sk_...`.

### 2. Preflight: inputs
`NODE_USE_ENV_PROXY=1 node $KIT/engine/preflight.mjs <project> --stage inputs`
Fix every FAIL before going on. Report every WARN to the user (for example, a soft logo or a missing recording) and let them decide.

### 3. Brand DNA (self-analysis)
The video must look and sound like the brand. Build or confirm its DNA before writing a word of script.

- **Known brand** (a pack exists in `<projects folder>/brands/<name>/` or `$KIT/brands/<name>/`): read its `BRAND-DNA.md`. Re-run the probe below only if the site was redesigned or the pack is older than 6 months.
- **New brand**:
  1. Open the brand's website in the browser. Scroll to the bottom once, then run `$KIT/templates/brand-probe.js` (paste it into the browser's JavaScript tool). Take screenshots of the hero, a middle section and the footer.
  2. If the intake has a brand guidelines PDF, read it. It overrides the website.
  3. Map the evidence to the 11 color roles: `primary-dark` (darkest heavily used color, for dark scenes and headlines), `primary` (most used saturated color), `primary-deep` (a darker shade of primary), `secondary`, `accent` (CTA or highlight color that contrasts with primary), `accent-2` (a softer accent), `alert` (red family), `ink`, `gray`, `line`. Choose the font (a Google Fonts family, or the closest Google look-alike when the brand font is proprietary; say which). For the logo, prefer the SVG in the home-page link. If it uses `currentColor` or has no fill, save it with explicit fills that read on white.
  4. Write the voice and look in brand terms: 3-5 personality words, one tone-of-voice sentence, visual motifs seen in the screenshots, do/don't rules, and 5 real headlines from the site.
  5. Save `<projects folder>/brands/<slug>/brand-dna.json` (format: `$KIT/brands/byteit/brand-dna.json`), then run `NODE_USE_ENV_PROXY=1 node $KIT/engine/brand_dna.mjs <that file>` (unsandboxed when the logo is an SVG). Client packs never go inside the kit.
  6. `node $KIT/engine/use_brand.mjs <project> <slug>`, then render the title and CTA stills.

**GATE 1A:** show the user `BRAND-DNA.md` (palette with contrast results, font, logo, tone) and the two stills. The user confirms or corrects, and decides every contrast warning (keep, darken, or keep for large text only).

### 4. Understand the material
- Read the whole document (`unzip -p file.docx word/document.xml` for .docx; Read the file for .pdf or .md).
- If there is a recording, sample it: `ffmpeg -i rec.mp4 -vf "fps=1/6,scale=960:-1,tile=3x2" sheet_%d.png`, and view the sheets.
- Write a one-screen brief: problem, tools, the steps in order, the output, the results with exact figures, plus open questions and any conflicting figures.

**GATE 1:** the user confirms the brief, the figures to feature and how to resolve conflicts.

### 5. Script and storyboard
- Write in the brand's voice: follow the tone, personality and do/don't rules in the project's `BRAND-DNA.md`.
- Write `vo.json`: one line per scene, `{"id": "sNN_name", "text": "..."}`. Aim for 130-150 words per minute, the target length in `project.json`, one idea per scene, sentences of 25 words or fewer, and numbers only from the brief. Use real spellings; put special pronunciations in `project.json` `pronounce`.
- Pick a scene type for each line from `$KIT/scenes/catalog.md`: hook, problem, solution, one step scene per step (3 to 6), hood (only with a recording), output, results, impact, CTA. Use `$KIT/examples/meeting-attendance/` as the reference.
- Write `SCRIPT.md`: a storyboard table with scene, visual and voiceover, plus the source notes (conflicts and how they were resolved, placeholders used).

**GATE 2:** the user approves the script and the storyboard. Text edits are cheap now and cost credits later.

### 6. Build the page (rough cues)
- Copy catalog snippets into `src/index.html` between the title and CTA scenes. Replace the content and keep the class structure.
- Recording: `node $KIT/engine/prep_footage.mjs <project> intake/<rec> --probe 30`, view `out/footage_probe.png`, choose a crop that removes private UI, then run it again with `--crop W:H:X:Y` and set `data-frames` to the printed count.
- Set rough `--d` cues from word position at 150 wpm.
- `node $KIT/engine/preflight.mjs <project> --stage script`. Every FAIL blocks, including a figure missing from the source.

### 7. Voice
- If INTAKE asks for samples or names a new voice: `NODE_USE_ENV_PROXY=1 node $KIT/engine/tts.mjs <project> --samples eric,brian,matilda`, then send the MP3s. **GATE 3:** the user picks the voice; record it in `project.json` `voice`.
- Full voiceover: `NODE_USE_ENV_PROXY=1 node $KIT/engine/tts.mjs <project>`. The first run saves `audio/ref.json`, the timing baseline.
- Tune each `--d` to the word moments using `audio/durations.json`.

### 8. Visual QA
- `node $KIT/engine/preflight.mjs <project> --stage render`
- `node $KIT/engine/render.mjs <project> --stills <start+2>,<middle>,<end-1>` for every scene, then view them as contact sheets. Check overlap, clipping, text wrap, cue timing, and the logo over content. Fix and re-render the stills until clean.
- Optional: send the user a contact sheet before the long render.

### 9. Render and mix
```bash
node $KIT/engine/render.mjs <project>      # unsandboxed, in the background, about 20 min
node $KIT/engine/make_audio.mjs <project>  # music bed + transition whooshes
node $KIT/engine/mix.mjs <project>         # ducked mix, loudnorm -16 LUFS
node $KIT/engine/make_srt.mjs <project>    # captions
```

### 10. Verify and deliver
- `ffprobe` the MP4: 1920x1080, the expected duration, an AAC stream. Measure loudness with `ebur128` (about -16 LUFS). Make a contact sheet every 10 s and view it.
- Send the MP4. Report the runtime, what was checked, what was not (you cannot hear the audio: ask the user to listen for pronunciation and cue timing), and the paths to `captions.srt` and `SCRIPT.md`.

**GATE 4:** the user's final review. A later change to the VO means steps 6 to 9 again; cues stretch automatically, so only re-check the stills.

## When something fails

| Symptom | Cause and fix |
|---|---|
| `api_key_id_used_as_api_key` | The .env holds the key ID. The user must paste the `sk_` secret (shown once at creation; rotate if lost). |
| `getaddrinfo ENOTFOUND api.elevenlabs.io` | Sandbox proxy: add `NODE_USE_ENV_PROXY=1` and the allowed domain `api.elevenlabs.io`. |
| Chrome `bootstrap_check_in ... Permission denied` | The render ran inside the sandbox. Run it unsandboxed. |
| `.env` "missing" though the user saved it | TextEdit saved `.env.rtf` or rich text. Use Format > Make Plain Text, or the `printf` one-liner in README. |
| A scene appears blank or late | Cue `--d` is beyond the VO length, or a stale `ref.json`. Check `out/timeline.json` and the `k` value per scene. |
| Footage looks zoomed | The img lacks `data-footage`, or the frame width is not 1440. |
