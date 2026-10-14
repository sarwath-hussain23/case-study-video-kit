# Changelog

## v1.2.0 (2026-10-14): review fixes

Answers the end-to-end review of `501690a` (non-ByteIT brand, private on-screen text). Every item is listed with what changed.

### A. Video understanding (new)

| Item | Change |
|---|---|
| A1 Footage report | `engine/understand_footage.mjs <project> <video>` writes `out/footage_report.md` and `.json`: duration, resolution, fps, audio level, scene-change frames (6 to 24), contact sheet |
| A2 Transcript | `--transcript` uses ElevenLabs speech-to-text with the same key (no extra account). It is skipped with a clear note when the audio is silent or missing. |
| A3 On-screen text scan | OCR with `tesseract` when installed (`setup.mjs` recommends it). Flags emails, phone numbers, tokens and `privateTerms`, grouped by text, with source-pixel regions and a ready-made `--blur` list. Without tesseract the report says so, and Claude must read every frame. |
| A4 Decision step | New footage gate before the facts are approved: the user picks `crop`, `blur`, `placeholders` or `none` with `confirm.mjs ... footage --mode`. The choice is stored as `footageMode`. `prep_footage.mjs --blur` pixelates regions, and the crop and blur are recorded in `project.json`. |
| A5 Preflight | The script stage fails when a recording has not been analysed or decided, or when a hood scene is used with `placeholders` or `none`. The render stage re-scans the prepared footage frames with OCR and fails on any private text it can read. |

### B. Bugs

| Item | Change |
|---|---|
| B1 Layout keyed to scene ids | `#s2_problem .eyebrow` is now `.problem-eyebrow`. The catalog has a rule: style with classes only. Renamed scene ids keep their layout (tested). |
| B2 Render TypeError | `render.mjs` reports "Cannot build the timeline" with the cause and "run tts.mjs first", and exits cleanly. |
| B3 Key check hides the reason | Length (51) and stray-whitespace checks run before the call, and the API's own message is printed, for example "HTTP 400: API key must be exactly 51 characters, got 67." |
| B4 Length estimate | The label is fixed: it is the whole video's length. It now shows voice time and scene padding separately. Tested: estimated 66 s, actual 67 s. |
| B5 ByteIT hardcoded | Catalog snippets use `{{BRAND}}`, `{{WEBSITE}}` and `{{PHONE}}`. The output file name follows the brand, including after `use_brand.mjs`. No phone means no phone span. INTAKE is brand-neutral. Tested: no ByteIT text or file name in a non-ByteIT project or its output. |

### C. Gates and docs

| Item | Change |
|---|---|
| C1 Facts gate not enforced | New `confirm.mjs` for the brand, facts, footage and script gates. It needs a real terminal and a typed "yes", records who approved and when, and stores a fingerprint of the approved file. Any later edit voids the approval. Preflight requires the sign-offs, and `tts.mjs` will not spend credits until the current script is approved. Facts cannot be confirmed while any answer is blank or "(guess)". |
| C2 Privacy decision | See A4. |
| C3 Render time | The docs give measured times: a 67 s video rendered in 99 s here. It depends on the machine, and the render prints progress. |
| C4 Derived colors | `brand-dna.json` takes a `derived` list. `BRAND-DNA.md` shows a Source column, website or **derived (guess)**, for Gate 1A. |
| C5 Figure-check false positive | Counters are checked at their `data-to` value, not the `0` placeholder. |
| Also | "Voiceover is current" now compares a script fingerprint instead of file dates, which copies and git checkouts used to trip. |

### D. Design limits

| Item | Change |
|---|---|
| D1 Panels | New catalog panels: `step-chat`, `step-checklist` and `step-formfill` (template fill with type-in values). 17 scene types now. |
| D2 Motifs | The brand pack sets a background `motif` (`arc`, `dots`, `bars`, `none`) that changes the shape behind light scenes. |
| D3 Logo ranking | The probe scores logo candidates: home-page link first, wide marks over square icons, social and partner badges removed. |
| D4 Scenes between steps | `class="step-aside" data-after="N"` shows the tracker with steps 1 to N done and none active. |

### Acceptance run (review checklist E)

Fresh clone, a non-ByteIT brand built from its website (dots motif, 3 derived colors), and a recording with an email, a phone number and a named person on screen.

1. The footage report flagged all three, with regions. `footageMode: blur` was recorded, and the pixelated footage passed the OCR re-scan. The same footage without blur failed, naming the leaking frames.
2. No ByteIT text, phone number or file name in the project or the output.
3. Every scene id was renamed (`open`, `pain`, `ask`, `verify`, `guard`, `fill`, `hood`, `numbers`, `close`) with no lost layout.
4. A bad key shows the API's message and the length check. The estimate was 66 s against an actual 67 s.
5. The script stage and `tts.mjs` refused until the user signed off. Editing `vo.json` afterwards voided the approval.
6. The MP4 is 1920x1080, 30 fps, AAC, -16.0 LUFS, 67.0 s against a 66.98 s timeline, with 13 captions. Every scene's mid-point still has content.

The sign-offs were typed through a pseudo-terminal for this automated run. Real users type "yes" themselves.

### Still not verified

- Windows (all scripts are Node; only macOS was run).
- Audio quality and pronunciation (a person must listen).
- OCR only catches what it can read, and names only when they are listed in `privateTerms`. Claude's frame-by-frame review stays mandatory. In the acceptance run, a person's name in an app's window title was readable after blurring only the flagged regions.

## v1.1.0

The beginner path: one start prompt, `setup.mjs`, a headless brand probe, Mac and Windows support, and a guide in plain English.

## v1.0.0

The first release: the engine, pre-flight checks, Brand DNA, the scene catalog, the ByteIT brand pack and the intake form.
