# Video intake form

Claude drafts this form from your use-case document and the organization's website, and marks anything it guessed with "(guess)". You only check and correct it at the Facts checkpoint. Every blank (a run of underscores) must be answered before the script is written; write "n/a" where a question does not apply.

## 1. Files to include in `intake/`

| | File | Required | Notes |
|---|---|---|---|
| A | Use-case document (.docx, .pdf, .md or .txt) | Yes | Needs: overview, problem, solution and tools, how it works (steps), output, results with numbers. Text-based PDF, not a scan. |
| B | Screen recording of the working automation (.mp4 or .mov) | Recommended | 1080p or larger, 30 s to 3 min, slow scrolling. Hide or note anything private (names, emails, API keys, client data). |
| C | Logo and brand guidelines | Only when the video uses the organization's own brand | SVG logo (best), or PNG at least 600 px wide with a transparent background. A brand guidelines PDF, if one exists, overrides what Claude reads from the website. |
| D | Screenshots of the result (doc, dashboard, report) | Optional | Used to make the "output" scene look like the real thing. |

## 2. About the project

- Project or client name: ____
- Can the client be named in the video? (yes / no / anonymize as "a client"): ____
- One sentence: what does the automation do? ____
- Who will watch it? (prospects, the client's leadership, internal team...): ____
- Where will it be posted? (LinkedIn, website, sales deck, email...): ____
- Target length (default 2 to 4 minutes): ____

## 3. Facts that must be right

- The 2 or 3 headline results to feature, copied exactly from the document (number + what it measures): ____
- If the document gives two different figures for the same thing, which one wins? ____
- Anything that must NOT appear (client names, internal tool names, numbers, people): ____
- Words or names with a special pronunciation (e.g. "n8n" said "n-eight-n"): ____

## 4. Brand and voice

- Brand: the kit's default brand, or the organization's own? If their own: their website URL (Claude studies it to build the Brand DNA) and, if you have them, an SVG logo and brand guidelines PDF in `intake/`: ____
- Call to action (website, phone or email shown at the end): ____
- Voice: the brand's default voice / hear samples first / other ElevenLabs voice ID: ____

## 5. Review

- Who approves the script and the final video? ____
- Deadline: ____
