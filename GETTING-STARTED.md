# Getting started: make a case study video

This kit turns one document about an automation you built into a polished 2 to 4 minute video. The video has a professional voiceover, music, captions and animated graphics in the ByteIT style.

You don't edit video. You fill in a form, drop in your files, and approve a few things along the way. Claude Code does the rest.

---

## What you get back

When the video is done, three files appear in your project's `out/` folder:

| File | What it is | What to do with it |
|---|---|---|
| `<name>.mp4` | The finished video (1080p, about 3 minutes) | Post it on LinkedIn or the website, or play it in a sales call |
| `captions.srt` | Subtitles that match the voiceover | Upload it with the video on LinkedIn or YouTube, so people watching on mute can follow |
| `SCRIPT.md` | The full script and a scene-by-scene plan | Share it with whoever needs to approve the wording |

---

## What you need to prepare

### 1. The use-case document (required)

A Word file, PDF or text document that explains the automation. It should cover:

- **The problem:** what was slow, manual or broken before
- **The solution:** which tools you connected
- **How it works:** the steps, in order
- **The output:** what the automation produces
- **The results:** real numbers, such as "8–10 minutes saved per meeting" or "95% accuracy"

> **Important:** the video only uses numbers that appear in this document. If a number isn't in the document, it won't appear in the video. This protects you from publishing something wrong.

### 2. A screen recording of the automation (recommended)

Record your screen while you scroll slowly through the working automation, for example the n8n workflow.

- 30 seconds to 3 minutes is plenty
- Use 1080p or higher
- **Hide anything private** before recording: client names, emails, passwords, API keys. If you can't hide it, write it in the form and it will be cropped out.

### 3. For a client-branded video: their website (optional)

Videos use the ByteIT look by default. To make one in a client's brand, write their website address in the form. Claude studies the site and builds the client's colors, font, logo and tone of voice for you. If the client has a brand guidelines PDF or an SVG logo, add those to `intake/` as well.

### 4. The intake form (required)

A short form, `INTAKE.md`, with 15 questions: who the video is for, which results to feature, what must not appear, and similar. It takes about 10 minutes. A filled-in example is at the end of this guide.

---

## One-time setup (about 15 minutes)

You need a Mac with these installed:

| What | Why | How to get it |
|---|---|---|
| **Claude Code** (desktop app) | It builds the video for you | [claude.com/claude-code](https://claude.com/claude-code) |
| **Homebrew** | Installs the tools below | [brew.sh](https://brew.sh) |
| **Node.js**, **ffmpeg**, **Git** | Run the video engine | Paste in Terminal: `brew install node ffmpeg git` |
| **Google Chrome** | Draws each frame of the video | [google.com/chrome](https://www.google.com/chrome) |
| **ElevenLabs account, paid plan** | The voiceover. The free plan doesn't allow business use. | [elevenlabs.io](https://elevenlabs.io): Starter plan or higher |

### Step 1: Install the kit

Open **Terminal** and paste these two lines, one at a time:

```bash
git clone https://github.com/sarwath-hussain23/case-study-video-kit.git ~/.claude/skills/case-study-video
```

```bash
cd ~/.claude/skills/case-study-video && npm install
```

### Step 2: Make a folder for your videos

```bash
mkdir -p ~/Videos/case-studies
```

### Step 3: Add your ElevenLabs key

1. Log in to ElevenLabs. Click your profile, then **API Keys**, then **Create API Key**.
2. Copy the key right away. It starts with `sk_` and is shown **only once**.
   - The short code in the key list is the *key ID*, not the key. It will not work.
3. In Terminal, paste this, replacing `sk_PASTE_YOUR_KEY_HERE` with your key:

```bash
printf 'ELEVENLABS_API_KEY=sk_PASTE_YOUR_KEY_HERE\n' > ~/Videos/case-studies/.env
```

> **Keep this key private.** Don't paste it in chat, email or Slack, and never put it inside the kit folder.

---

## Making a video (every time)

1. **Open Claude Code** in your `~/Videos/case-studies` folder.
2. **Type:** `/case-study-video` and describe the video in one line, for example *"Video for our invoice-matching automation."*
3. Claude creates a project folder. **Put your files in its `intake/` folder:** the document, the recording, and the filled-in `INTAKE.md`.
4. Tell Claude: **"Files are in."**
5. **Claude runs a pre-flight check.** It confirms everything is there and correct before spending any money or time. If something is missing, it tells you exactly what to fix.
6. **You approve 3 to 5 things along the way:**

| Checkpoint | What you'll see | What you're checking |
|---|---|---|
| **0. Brand** *(client brands only)* | The brand's "DNA": colors, font, logo, tone of voice, built by Claude from their website | Does it look and sound like them? |
| **1. Facts** | A one-page summary of the problem, steps and results | Are the facts and numbers right? |
| **2. Script** | The words the narrator will say, scene by scene | Does it sound right? Change anything you like; it's free at this stage. |
| **3. Voice** *(optional)* | 3 short voice samples | Which voice fits? (Default: "Eric") |
| **4. Final video** | The finished MP4 | Watch the whole thing, **with sound** |

7. Rendering takes about 20 minutes. You can do other work meanwhile.

**Total time:** about 45 to 90 minutes from files to finished video, mostly waiting.

---

## Before you publish: your 2-minute check

Claude can't hear audio, so a human must:

- [ ] Watch the whole video **with sound**
- [ ] Check that names, tools and acronyms are pronounced correctly
- [ ] Check that every number matches the source document
- [ ] Check that nothing private shows on screen
- [ ] Check that the animations line up with what the narrator says

Found a problem? Tell Claude what and at which time (for example, *"at 1:12 'Fathom' sounds wrong"*). Most fixes take 20 to 30 minutes, mostly re-rendering.

---

## When something goes wrong

| You see | What it means | What to do |
|---|---|---|
| "API key ID used as API key" | You copied the key's short ID, not the key | Create a new key in ElevenLabs and copy the `sk_…` value |
| "Missing ELEVENLABS_API_KEY" | The key file isn't where the kit looks | Re-run Step 3 above |
| The key file "isn't found" but you saved it | TextEdit saved it as rich text or added `.rtf` | Use the `printf` command in Step 3 instead of TextEdit |
| "INTAKE.md filled in … FAIL" | Some questions in the form are still blank (`____`) | Answer them, or write "n/a" |
| "Figure '…' appears in the source document … FAIL" | The script has a number that isn't in your document | Correct the script, or add the source to the document |
| "Not enough credits" | Your ElevenLabs balance is low | Top up or upgrade your plan |
| The logo looks blurry | The logo file is small | Get a larger logo (at least 600 px wide) |

---

## Example: a filled-in intake form

```
- Project or client name: Automated Meeting Attendance & AI Notes
- Can the client be named in the video?: yes (ByteIT internal build)
- One sentence: what does the automation do? Pulls Google Calendar meetings,
  matches who attended in Google Meet, and writes attendance plus AI notes
  into the meeting's Google Doc.
- Who will watch it?: Prospects (small business owners and operations leads)
- Where will it be posted?: LinkedIn and byteit.com
- Target length: 2 to 4 minutes
- Headline results: 100% automated capture; 8–10 min to produce minutes
  cut to 0; 95%+ attendance precision
- If the document gives two different figures, which one wins?: 8–10 minutes
- Anything that must NOT appear: workspace owner's name in the n8n title bar
- Special pronunciations: n8n is said "n-eight-n"
- Brand: ByteIT
- Call to action: byteit.com, 855-429-8348
- Voice: Eric
- Who approves: Sarwath
- Deadline: n/a
```

---

**Questions?** Open an issue on this repository, or ask Claude Code directly: it has read this whole kit.
