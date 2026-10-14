# Getting started: make a case study video

This kit turns a document about an automation you built into a polished 2 to 4 minute video. The video has a professional voiceover, music, captions and animated graphics in the organization's own colors.

You don't edit video, and you don't need technical skills. You give Claude three things, approve a few checkpoints, and get the finished video.

---

## What you need (once)

| | What | Notes |
|---|---|---|
| 1 | **A Claude account with Claude Code** | The desktop app is easiest: [claude.com/claude-code](https://claude.com/claude-code) |
| 2 | **A Mac or Windows computer** | Claude installs the other software for you (it asks first) |
| 3 | **An ElevenLabs account, paid plan** | For the narrator's voice. The Starter plan or higher allows business use; the free plan doesn't. [elevenlabs.io](https://elevenlabs.io) |

### Getting your ElevenLabs key

Claude will ask for this the first time. Here's where to find it:

1. Log in to ElevenLabs. Click your profile, then **API Keys**, then **Create API Key**.
2. **Copy the key right away.** It starts with `sk_` and is shown only once.
   - The short code shown later in the key list is the key's *ID*. It won't work.
3. Claude opens a small file for you (TextEdit on a Mac, Notepad on Windows). Paste the key after the `=` sign, save, and close it.

> **Keep this key private.** Don't paste it in the chat, email or Slack.

---

## What you prepare (each video)

1. **The use-case document** (Word, PDF or text). It should cover the problem, the tools, how it works step by step, the output, and the results **with real numbers**.
   > The video only uses numbers that appear in this document. That protects you from publishing something wrong.
2. **A screen recording** of the working automation (optional but recommended). Scroll slowly; 30 seconds to 3 minutes is plenty. **Hide anything private** first: client names, emails, passwords.
3. **The organization's website**, for example `https://client.com`. Claude studies it and builds their colors, font, logo and tone of voice. For a ByteIT video, just write "ByteIT".

---

## How to start

Open Claude Code and paste this, filling in the three lines:

```text
Install the case study video kit from https://github.com/sarwath-hussain23/case-study-video-kit
and follow its SKILL.md to make a case study video.
Use-case document: <drag the file here>
Screen recording: <drag the file here, or write "none">
Organization website: <https://... , or write "ByteIT">
```

Tip: you can drag a file from Finder or File Explorer into the Claude Code window to insert its location.

The first time, Claude installs the kit and the tools it needs (about 10 minutes). After that, it goes straight to work.

---

## The checkpoints you approve

Claude stops and waits for your OK at each of these:

| Checkpoint | What you'll see | What you check |
|---|---|---|
| **Brand** *(non-ByteIT brands only)* | The organization's colors, font, logo and tone of voice, plus two sample frames | Does it look and sound like them? |
| **Facts** | A one-page summary of the problem, steps and results, and the answers Claude filled in for you (anything it guessed is marked "(guess)") | Are the facts and numbers right? Fix any guesses. |
| **Script** | The words the narrator will say, scene by scene | Does it sound right? Changes are free at this stage. |
| **Voice** *(optional)* | 3 short voice samples | Which voice fits? (Default: "Eric") |
| **Final video** | The finished MP4 | Watch the whole thing, **with sound** |

Rendering the video takes about 20 minutes. You can do other work meanwhile.

**Total time:** about 45 to 90 minutes from start to finished video, mostly waiting.

---

## What you get back

| File | What it is | What to do with it |
|---|---|---|
| `<name>.mp4` | The finished video (1080p, about 3 minutes) | Post it on LinkedIn or the website, or play it in a sales call |
| `captions.srt` | Subtitles that match the voice | Upload it with the video, so people watching on mute can follow |
| `SCRIPT.md` | The script and scene plan | Share it with whoever approves the wording |

Claude tells you where these files are when it finishes. They're in a `case-studies` folder in your home folder.

---

## Before you publish: your 2-minute check

Claude can't hear audio, so a person must:

- [ ] Watch the whole video **with sound**
- [ ] Check names, tools and acronyms are pronounced correctly
- [ ] Check every number matches the source document
- [ ] Check nothing private shows on screen

Found a problem? Tell Claude what and when, for example *"at 1:12, 'Fathom' sounds wrong"*. Most fixes take 20 to 30 minutes, mostly re-rendering.

---

## If something goes wrong

| You see | What it means | What to do |
|---|---|---|
| "Key starts with sk_ … FAIL" | You pasted the key's ID, or the file still has no key | Create a new key in ElevenLabs and paste the `sk_…` value |
| "Missing ELEVENLABS_API_KEY" | The key file is empty or wasn't saved | Ask Claude to open the key file again, paste the key, save |
| "Not enough credits" | Your ElevenLabs balance is low | Top up or upgrade your plan |
| "Figure … appears in the source document … FAIL" | The script has a number that isn't in your document | Correct the script, or add the source to the document |
| Windows: a tool is "missing" right after installing it | Windows hasn't reloaded its settings | Close and reopen Claude Code |
| Windows: "winget not found" | The Windows installer tool is missing | Install **App Installer** from the Microsoft Store |
| Mac: "brew not found" | Homebrew (the Mac installer tool) is missing | Claude shows you the one-line install from [brew.sh](https://brew.sh) |
| The logo looks blurry | The logo on the website is small | Send Claude a bigger logo file (SVG is best) |

---

**Questions?** Ask Claude Code directly: it has read this whole kit. Or open an issue on this repository.
