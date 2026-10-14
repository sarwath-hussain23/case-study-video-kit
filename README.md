# Case Study Video Kit

Turn a use-case document into a branded 2 to 4 minute case study video, with a professional voiceover, music, captions and animated graphics. Claude Code does the work and checks with you at a few approval points.

Reference result: *Automated Meeting Attendance & AI Notes* (2:57). Its source lives in `examples/meeting-attendance/`. What changed in each version: [CHANGELOG.md](CHANGELOG.md).

## Start here

**You need:** a Claude account with **Claude Code**, a Mac or Windows computer, and a paid **ElevenLabs** account for the voice (Starter plan or higher). Claude installs everything else for you.

**Open Claude Code and paste this** (fill in the three lines):

```text
Install the case study video kit from https://github.com/sarwath-hussain23/case-study-video-kit
and follow its SKILL.md to make a case study video.
Use-case document: <drag the file here>
Screen recording: <drag the file here, or write "none">
Organization website: <https://... , or write "ByteIT">
```

Claude then:
1. **Installs the kit and the tools it needs:** Node.js, ffmpeg, Google Chrome. It asks before installing anything.
2. **Asks for your ElevenLabs key once.** You paste it into a file that Claude opens for you, never into the chat.
3. **Studies the organization's website** and builds its look: colors, font, logo, tone of voice.
4. **Shows you its plan and waits for your OK** at each checkpoint (below).
5. **Delivers the video**, captions and script.

The plain-English walkthrough is [GETTING-STARTED.md](GETTING-STARTED.md).

## Checkpoints (you approve each one)

At each checkpoint Claude shows you what to review and gives you **one command to paste into a terminal window**. You type `yes` to approve. Only a person can do this, and editing an approved file afterwards cancels the approval.

| # | Checkpoint | What you check |
|---|---|---|
| 1A | **Brand** (only for the organization's own brand) | Colors, font, logo and tone look like the organization; colors Claude had to guess are marked |
| 1 | **Facts** | The summary and the numbers are right; correct anything marked "(guess)" |
| – | **Footage** (only with a recording) | The privacy report: what private text was found, and whether to crop, blur, use mockups instead, or leave the recording out |
| 2 | **Script** | The words the narrator will say. Changes are free now; the voice is only generated after this approval. |
| 3 | **Voice** (optional) | Pick from 3 voice samples (default: "Eric") |
| 4 | **Final video** | Watch it **with sound** before you publish |

Typical time: 30 to 90 minutes, mostly your review. Rendering is unattended; measured on a recent Mac: a 67-second video in under 2 minutes. Older computers take longer.

## What you get

| File | What it is |
|---|---|
| `out/<name>.mp4` | The video: 1920x1080, 30 fps, loudness normalized for social and web |
| `out/captions.srt` | Subtitles to upload with the video |
| `SCRIPT.md` | The scene-by-scene script and the source notes |
| `BRAND-DNA.md` | The brand guideline Claude built and used |

---

## For maintainers

### What's in the kit

| Path | What it is |
|---|---|
| `SKILL.md` | Claude's playbook: install, inputs, pre-flight checks, Brand DNA, approval gates |
| `setup.mjs` | One-time setup on macOS or Windows: checks tools, runs `npm install`, creates `<home>/case-studies` and its `.env` |
| `new-project.mjs` | Creates a project folder (`--website` records the organization's site) |
| `INTAKE.md` | Intake form. Claude drafts it from the inputs; the user confirms it at Gate 1. |
| `engine/preflight.mjs` | Pre-flight checks in 3 stages: inputs, script, render |
| `engine/read_doc.mjs` | Prints the text of a .docx, .md, .txt or .pdf |
| `engine/probe_site.mjs` | Reads a website in headless Chrome: colors by usage, fonts, type scale, logo, headlines, screenshots |
| `engine/brand_dna.mjs` | Turns a brand DNA file into a brand pack, with WCAG contrast checks and `BRAND-DNA.md` |
| `engine/use_brand.mjs` | Switches a project to another brand pack |
| `engine/tts.mjs` | ElevenLabs voiceover and voice samples |
| `confirm.mjs` | The user's sign-off at a gate (brand, facts, footage, script). Needs a real terminal and a typed "yes"; voided when the approved file changes |
| `engine/understand_footage.mjs` | Footage report: scene frames, contact sheet, OCR privacy scan with regions and a blur list, optional ElevenLabs transcript |
| `engine/prep_footage.mjs` | Turns a screen recording into cropped frames, pixelating private regions |
| `engine/render.mjs`, `make_audio.mjs`, `mix.mjs`, `make_srt.mjs` | Frames, music, final mix, captions |
| `scenes/catalog.md` | The scene library: 14 tested scene types with markup and timing rules |
| `templates/` | Shared page files (`base.css`, `player.js`, icons, starter page) and `brand-probe.js` |
| `brands/byteit/` | ByteIT brand pack: `brand-dna.json` (source), `BRAND-DNA.md`, colors, Poppins font (SIL Open Font License, `fonts/OFL.txt`), logo, default voice |
| `examples/meeting-attendance/` | The reference project's page, script and settings (no client files) |

### Manual install

```bash
git clone https://github.com/sarwath-hussain23/case-study-video-kit.git ~/.claude/skills/case-study-video
node ~/.claude/skills/case-study-video/setup.mjs
```

On Windows the folder is `%USERPROFILE%\.claude\skills\case-study-video`. Update later with `git pull` in that folder.

- The ElevenLabs key goes in `<home>/case-studies/.env` as `ELEVENLABS_API_KEY=sk_...`. Use the **secret key** (starts with `sk_`, shown once at creation), not the short key ID.
- **Never put a `.env` inside the kit.** This repository is public.

### What the pre-flight checks catch

| Stage | Blocks the run (FAIL) | Flags for a decision (WARN) |
|---|---|---|
| inputs | Missing tools (with the install command for your OS), no use-case document, wrong ElevenLabs key (key ID, placeholder, wrong length, stray spaces; the API's own message is shown), API unreachable, not enough credits | Unreadable or scanned document, no measurable result, logo under 600 px, short or low-resolution recording, free plan, no Brand DNA |
| script | Brand, facts or footage not signed off by the user, recording not analysed, real footage used against the footage decision, scene and script ids out of sync, unfilled placeholders, **any figure that is not in the source document** (counters are checked at the value they count to) | Length outside the target (voice time and scene padding shown separately), sentences over 25 words |
| render | Script not signed off, missing voiceover files, timeline out of date, wrong footage frame count, **private text still readable in the prepared footage** (OCR), blur mode without blur regions, missing brand files | Voiceover older than the script, OCR not installed |

### Brand DNA: videos in a client's brand

1. **Probe:** `engine/probe_site.mjs` opens the site in headless Chrome. It collects colors weighted by page coverage, fonts, type scale, buttons, the logo from the home-page link, headlines and contact details, plus three screenshots.
2. **Read:** Claude maps the evidence to 11 color roles, picks the font (or the closest Google Fonts look-alike for a paid font), and describes the personality, tone of voice, motifs and do/don't rules. A brand guidelines PDF in `intake/` overrides the website.
3. **Build:** `engine/brand_dna.mjs` downloads the fonts, converts an SVG logo to a sharp PNG, checks contrast for every color pair the video uses, and writes `BRAND-DNA.md`.
4. **Approve (Gate 1A).**

Client brand packs are saved in `<home>/case-studies/brands/<name>/`, **outside the kit**, so they never reach this public repository.

The ByteIT pack is built the same way, from `brands/byteit/brand-dna.json`. Its contrast check flags ByteIT orange (`#F5831F`) on white at 2.58:1, under the 3:1 minimum for large text (eyebrow labels and step numbers).

### Known limits

- **Logo:** the ByteIT logo published on byteit.com is 219 px wide and looks soft at full size. Replace `brands/byteit/logo.png` with a larger export when one is available.
- **Music:** the music bed is synthesized: royalty-free but simple. To use a licensed track, drop it in as `audio/music.wav` after running `make_audio.mjs`.
- **Audio review:** Claude cannot listen to audio. A person must check pronunciation and timing before publishing.
- **Mockups:** the step and output mockups are recreated in HTML with placeholder data, not real screenshots.
- **Windows:** all scripts are cross-platform Node. The macOS path was tested end to end; run one test video on Windows before rolling out widely.
- **Privacy scan:** OCR needs `tesseract` (free; `setup.mjs` shows the install command). Without it, Claude reads every frame itself, and the render-stage re-scan of the footage is skipped with a warning.
- **Sign-offs** stop accidental self-approval: `confirm.mjs` needs a real terminal and a typed "yes". They are a process control, not a security boundary against someone deliberately bypassing them.
