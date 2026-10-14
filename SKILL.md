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
- **Talk to the user in plain words.** Many users are not technical. Say what you need and why, one step at a time. Never ask them to edit code.
- **macOS and Windows.** All scripts are Node and work on both. Quote paths (they often contain spaces). On Windows use PowerShell; there is no Bash sandbox there.
- **Environment (Claude Code on macOS):** Chrome cannot start inside the Bash sandbox, so run `render.mjs`, `probe_site.mjs` and `brand_dna.mjs` (SVG logos) unsandboxed. Scripts that call the internet pick up a proxy on their own; allow the domains `api.elevenlabs.io`, `fonts.googleapis.com`, `fonts.gstatic.com` and the brand's site. Run the full render in the background; it takes about 20 minutes for 3 minutes of video.

## Workflow

### 0. First time on this computer
If the kit is not installed yet (the user pasted the repository link):
1. Clone it: `git clone https://github.com/sarwath-hussain23/case-study-video-kit.git "<home>/.claude/skills/case-study-video"`. If Git is missing, install it first (`brew install git` on macOS, `winget install Git.Git` on Windows) after the user agrees. Then read `SKILL.md` from that folder and follow it; it becomes a slash command after Claude Code restarts.
2. Run `node "$KIT/setup.mjs"`. It checks Node, ffmpeg and Chrome, runs `npm install`, and creates `<home>/case-studies` with an empty `.env`. For each missing tool, show the user the install command it prints, run it after they agree, then run setup again.
3. ElevenLabs key: tell the user to open the `.env` file with the command setup printed, paste their **secret** key (starts with `sk_`, shown once when created under ElevenLabs > API Keys) after `=`, and save. Never ask them to paste the key in chat.

### 1. Collect the three inputs
The user only needs to give you:
- the **use-case document** (Word, PDF or text),
- the **screen recording** of the workflow (optional, recommended),
- the **organization's website** (for the brand; leave empty for ByteIT).

Create the project: `node "$KIT/new-project.mjs" "<home>/case-studies/<slug>" --title "<short title>" [--website <url>]`, and copy the document and recording into its `intake/` folder. Do not ask the user to fill in the intake form; you draft it in step 4.

### 2. Preflight: inputs
`node "$KIT/engine/preflight.mjs" "<project>" --stage inputs`
Fix every FAIL before going on. Report every WARN to the user (for example, a soft logo or a missing recording) and let them decide.

### 3. Brand DNA (self-analysis)
The video must look and sound like the brand. Build or confirm its DNA before writing a word of script.

- **Known brand** (a pack exists in `<projects folder>/brands/<name>/` or `$KIT/brands/<name>/`): read its `BRAND-DNA.md`. Re-run the probe below only if the site was redesigned or the pack is older than 6 months.
- **New brand**:
  1. Run `node "$KIT/engine/probe_site.mjs" <website> "<projects folder>/brands/<slug>/probe"`. It writes `probe.json` (colors by usage, fonts, type scale, buttons, logo candidates, headlines, phone), three screenshots, and `logo-inline.svg` when the logo is an inline SVG. View the screenshots. (With a browser tool you can also paste `$KIT/templates/brand-probe.js` into the page.)
  2. If the intake has a brand guidelines PDF, read it. It overrides the website.
  3. Map the evidence to the 11 color roles: `primary-dark` (darkest heavily used color, for dark scenes and headlines), `primary` (most used saturated color), `primary-deep` (a darker shade of primary), `secondary`, `accent` (CTA or highlight color that contrasts with primary), `accent-2` (a softer accent), `alert` (red family), `ink`, `gray`, `line`. Choose the font (a Google Fonts family, or the closest Google look-alike when the brand font is proprietary; say which). For the logo, prefer the SVG in the home-page link. If it uses `currentColor` or has no fill, save it with explicit fills that read on white.
  4. Write the voice and look in brand terms: 3-5 personality words, one tone-of-voice sentence, visual motifs seen in the screenshots, do/don't rules, and 5 real headlines from the site.
  5. Save `<projects folder>/brands/<slug>/brand-dna.json` (format: `$KIT/brands/byteit/brand-dna.json`), then run `node "$KIT/engine/brand_dna.mjs" "<that file>"`. Client packs never go inside the kit.
  6. `node $KIT/engine/use_brand.mjs <project> <slug>`, then render the title and CTA stills.

**GATE 1A:** show the user `BRAND-DNA.md` (palette with contrast results, font, logo, tone) and the two stills. The user confirms or corrects, and decides every contrast warning (keep, darken, or keep for large text only).

### 4. Understand the material
- Read the whole document: `node "$KIT/engine/read_doc.mjs" "<file>"` (.docx, .md and .txt on macOS and Windows; .pdf when pdftotext exists, otherwise read the PDF directly).
- If there is a recording, sample it: `ffmpeg -i rec.mp4 -vf "fps=1/6,scale=960:-1,tile=3x2" sheet_%d.png`, and view the sheets.
- Write a one-screen brief: problem, tools, the steps in order, the output, the results with exact figures, plus open questions and any conflicting figures.
- Draft `intake/INTAKE.md` yourself: answer every question from the document, the probe and the brand pack (CTA = brand website and phone, voice = brand default, audience = prospects unless the document says otherwise). Mark each answer you guessed with "(guess)".

**GATE 1:** show the brief and the drafted INTAKE.md. The user confirms or corrects the facts, the figures to feature, how to resolve conflicts, and every "(guess)". Remove the "(guess)" marks once confirmed.

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
- If INTAKE asks for samples or names a new voice: `node $KIT/engine/tts.mjs <project> --samples eric,brian,matilda`, then send the MP3s. **GATE 3:** the user picks the voice; record it in `project.json` `voice`.
- Full voiceover: `node $KIT/engine/tts.mjs <project>`. The first run saves `audio/ref.json`, the timing baseline.
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
| `getaddrinfo ENOTFOUND api.elevenlabs.io` | Network blocked. In the Claude Code sandbox, allow the domain `api.elevenlabs.io`. Elsewhere, check the internet connection or firewall. |
| `winget` or `brew` not found | Windows: install App Installer from the Microsoft Store. macOS: install Homebrew from https://brew.sh. |
| A tool is "missing" right after installing it on Windows | Open a new terminal (or restart Claude Code) so the new PATH loads. |
| Chrome `bootstrap_check_in ... Permission denied` | The render ran inside the sandbox. Run it unsandboxed. |
| `.env` "missing" though the user saved it | TextEdit saved `.env.rtf` or rich text. Use Format > Make Plain Text, or the `printf` one-liner in README. |
| A scene appears blank or late | Cue `--d` is beyond the VO length, or a stale `ref.json`. Check `out/timeline.json` and the `k` value per scene. |
| Footage looks zoomed | The img lacks `data-footage`, or the frame width is not 1440. |
