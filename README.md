# Case Study Video Kit

Turns a use-case document, plus an optional screen recording, into a branded 2 to 4 minute case study video. The video has an ElevenLabs voiceover, a music bed, captions and motion graphics in the ByteIT style. A requester fills in one form and drops files in a folder; Claude Code does the rest and stops for approval at four points.

Reference result: *Automated Meeting Attendance & AI Notes* (2:57). Its source lives in `examples/meeting-attendance/`.

## What's in the kit

| Path | What it is |
|---|---|
| `SKILL.md` | Claude's step-by-step playbook, with pre-flight checks and approval gates |
| `INTAKE.md` | The form a requester fills in. It is copied into every new project. |
| `new-project.mjs` | Creates a project folder with the brand, the engine files and a starter page |
| `engine/preflight.mjs` | Pre-flight checks in 3 stages: inputs, script, render |
| `engine/tts.mjs` | ElevenLabs voiceover and voice samples |
| `engine/prep_footage.mjs` | Turns a screen recording into cropped frames |
| `templates/brand-probe.js` | Reads a brand's website: colors by usage, fonts, type scale, logo, headlines, contact |
| `engine/brand_dna.mjs` | Turns a brand DNA file into a brand pack, with WCAG contrast checks and `BRAND-DNA.md` |
| `engine/use_brand.mjs` | Switches an existing project to another brand pack |
| `engine/render.mjs`, `make_audio.mjs`, `mix.mjs`, `make_srt.mjs` | Frames, music, final mix, captions |
| `scenes/catalog.md` | The scene library: 14 tested scene types with markup and timing rules |
| `templates/` | Shared page files: `base.css` (components), `player.js` (timeline), icons, starter page |
| `brands/byteit/` | ByteIT brand pack: `brand-dna.json` (source), `BRAND-DNA.md` (guideline), colors, font (Poppins, SIL Open Font License, see `fonts/OFL.txt`), logo, default voice (Eric) |
| `examples/meeting-attendance/` | The reference project's page, script and settings (no client files) |

## Must-have checklist (for every person who runs the kit)

**Accounts**
- [ ] **Claude Code**: the desktop app is recommended, because it can preview the page and send the video back in chat.
- [ ] **ElevenLabs, paid plan**: Starter or higher gives commercial rights; the free plan does not. One 3-minute video uses about 3,000 to 6,000 credits, including samples and retakes.

**Software**
- [ ] macOS. This is the tested platform; Linux should work but has not been tested.
- [ ] Node.js 18 or newer
- [ ] ffmpeg and ffprobe (`brew install ffmpeg`)
- [ ] Google Chrome, which renders the frames
- [ ] About 1 GB of free disk space per project

**Claude Code skills**
- [ ] **This kit, installed as the `case-study-video` skill.** This is the only required skill.
- Not required: `karpathy-guidelines` and `caveman` are personal working-style preferences. `obscura` and other browser skills are only needed to sample a new brand from its website; the desktop app's built-in browser covers that.

Run `node engine/preflight.mjs <project> --stage inputs` to confirm the setup. It checks all of the above except the plan type, which it reports as a warning.

## Install (once per machine)

```bash
git clone https://github.com/sarwath-hussain23/case-study-video-kit.git ~/.claude/skills/case-study-video
cd ~/.claude/skills/case-study-video && npm install
```

Update later with `git pull` in the same folder. New to all this? Start with [GETTING-STARTED.md](GETTING-STARTED.md), the plain-English guide.

Create a projects folder anywhere, for example `~/Videos/case-studies/`, and put the ElevenLabs key in it:

```bash
printf 'ELEVENLABS_API_KEY=sk_your_secret_key\n' > ~/Videos/case-studies/.env
```

- Use the **secret key**. It starts with `sk_` and is shown only once, when the key is created. The short "key ID" will not work.
- **Never put a `.env` inside the kit.** The kit gets shared; the key must not travel with it.

## Making a video

1. In Claude Code, run `/case-study-video` and say what the video is about. Claude creates the project folder.
2. The requester fills in `intake/INTAKE.md` and drops the files into `intake/`: the use-case document is required, and a screen recording is recommended.
3. Claude runs the pre-flight check, then works through the gates:
   - **Gate 1A, Brand:** for a new brand, Claude studies its website and shows the Brand DNA: palette with contrast results, font, logo, tone of voice. ByteIT videos skip this step.
   - **Gate 1, Facts:** a one-page brief of the problem, steps and results, plus any conflicting figures to resolve.
   - **Gate 2, Script:** the voiceover script and storyboard. Edit freely here; it costs nothing yet.
   - **Gate 3, Voice:** only if samples were requested.
   - **Gate 4, Final:** the rendered MP4.
4. You receive `out/<name>.mp4`, `out/captions.srt` and `SCRIPT.md`.

Typical time is 45 to 90 minutes from intake to final, including about 20 minutes of unattended rendering.

## What the pre-flight checks catch

| Stage | Blocks the run (FAIL) | Flags for a decision (WARN) |
|---|---|---|
| inputs | Missing tools, no use-case document, blanks left in the form, missing or wrong ElevenLabs key (key ID instead of secret), API unreachable, not enough credits | Unreadable or scanned document, no measurable result, logo under 600 px, short or low-resolution recording, free plan |
| script | Scene and script ids out of sync, unfilled placeholders, **any figure that is not in the source document** | Length outside the target, sentences over 25 words |
| render | Missing voiceover files, timeline out of date, wrong footage frame count, missing brand files | Voiceover older than the script |

## Brand DNA: videos in a client's brand

Claude builds a brand pack from the brand's own website, so nobody has to type in hex codes.

1. **Probe:** Claude opens the site and runs `templates/brand-probe.js`. It collects colors weighted by how much of the page they cover, fonts, the type scale, buttons, the logo from the home-page link, headlines and contact details. It also takes screenshots.
2. **Read:** Claude maps the evidence to 11 color roles, picks the font (or the closest Google Fonts look-alike for a paid font), and describes the personality, tone of voice, motifs and do/don't rules. A brand guidelines PDF in `intake/` overrides the website.
3. **Build:** `engine/brand_dna.mjs` turns that into a brand pack. It downloads the fonts and converts an SVG logo to a sharp PNG. It checks contrast for every color pair the video uses and writes `BRAND-DNA.md`.
4. **Approve (Gate 1A):** you see `BRAND-DNA.md` and two sample frames, and decide on any contrast warnings.

Client brand packs are saved in `<projects folder>/brands/<name>/`, **outside the kit**, so they never end up in this public repository. To switch a project to another brand: `node engine/use_brand.mjs <project> <brand>`.

The ByteIT pack itself is built the same way, from `brands/byteit/brand-dna.json`. Its DNA check flagged one issue: ByteIT orange (`#F5831F`) on white is 2.58:1, under the 3:1 minimum for large text. It is used for eyebrow labels and step numbers. Decide whether to keep it (brand fidelity) or darken it (legibility).

## Known limits

- **Logo:** the ByteIT logo from byteit.com is only 219 px wide and looks soft at full size. Replace `brands/byteit/logo.png` with a larger export when one is available.
- **Music:** the music bed is synthesized, so it is royalty-free but simple. To use a licensed track, drop it in as `audio/music.wav` after running `make_audio.mjs`.
- **Audio review:** Claude cannot listen to audio. A human must check pronunciation and how the voice lines up with the visuals before publishing.
- **Mockups:** the "output" and step mockups are recreated in HTML, not real screenshots. They use placeholder data on purpose.
