# Scene catalog

Every scene below was rendered and checked: the first 14 in the meeting-attendance example, the chat, checklist and template-fill panels in the v1.2 acceptance run. Build a new video by copying these sections into `src/index.html`, between the title and CTA scenes, and replacing the content. Write a custom panel only when no snippet fits the step (see "Custom panels" at the end).

## Rules that apply to every scene

**Structure**
- A scene is `<section class="scene light|dark|blue" id="sNN_name">` directly inside `#stage`. Scenes play in document order.
- Each scene id needs a line with the same `id` in `vo.json`, unless the scene has `data-fixed="<seconds>"` (no voiceover).
- `data-tail="<seconds>"` holds a scene after its voiceover ends (used on the CTA).
- Light scenes get the brand logo in the top-right corner automatically. Add `data-nologo` when the scene shows the logo itself.
- Step scenes use `class="scene light step" data-step="N"`. The "How it works" progress tracker is added automatically and counts all `.step` scenes.

**Timing (cues)**
- An animated element has class `a` plus one primitive, and `style="--d:SECONDS"`.
- `--d` counts from the moment the scene's voiceover starts. Negative values start before the voice (the scene fades in 0.7 s earlier).
- Write the voiceover first, generate it, then set each `--d` to the moment the VO says the matching word. Use the durations in `audio/durations.json`; a word sits at roughly (its character position / line length) x line duration.
- If the voiceover is regenerated later, cues stretch automatically (VO / `audio/ref.json`). Re-check stills afterwards.
- Counters: `<span class="count" data-to="95" data-d="9.4" data-len="2.2">0</span>`. Add `data-from` to start elsewhere and `data-fmt="hms"` for HH:MM:SS.

**Animation primitives** (all in `base.css`)
- `rise` (up and in), `slide` (from the left), `pop` (scale with overshoot), `fade`, `fadeout` (exit; put it on a wrapper)
- `draw` (SVG path stroke; the player sets `pathLength`), `grow-x` (bars, set `--len`), `growy`, `strike` (strike-through line)
- Scene-specific: `sweep` (ring), `scanbar`, `botmove`, `docscroll`, `fly1`..`fly3`

**Styling**
- Position and style with classes only. Never write CSS for a scene id (`#s2_problem ...`): ids change from project to project.
- `{{BRAND}}`, `{{WEBSITE}}`, `{{PHONE}}` and `{{TAGLINE}}` in the title and CTA snippets come from the project's brand (`new-project.mjs` fills them in the starter page). Drop the phone `<span>` and its `<i>` when the brand has no phone.
- Use brand tokens only: `--primary-dark`, `--primary`, `--primary-deep`, `--secondary`, `--accent`, `--accent-2`, `--alert`, `--ink`, `--gray`, `--line`, `--font`. Never hard-code a brand color.
- Text helpers: `hl-text` (primary-colored words), `swoosh-wrap` + `swoosh` (accent underline), `eyebrow`, `h2`, `lead`, `tc`.
- Icons: `<svg><use href="#i-NAME"/></svg>` with NAME one of cal, video, doc, folder, spark, flow, check, x, clock, bot, user, eye, filter, rocket, target. Add new symbols to the sprite at the top of `index.html`.
- Canvas is 1920x1080. Keep 150 px side margins. The step panel is 950x720 at left 820, top 200.

**Content**
- Every number on screen and in the voiceover must come from the source document. Preflight `--stage script` flags numbers it cannot find.
- People, emails, meeting codes and times in mockups are placeholders. Never show real client data unless INTAKE.md says it is cleared.
- One idea per scene. Keep on-screen text shorter than the voiceover; the screen shows the key nouns and numbers, the voice tells the story.

**Match-pairs geometry:** with three cards per column, the link lines and tags sit at y = 178, 308 and 438 inside the panel (tag `top` = y - 16). Add or remove cards in steps of 130 px.

## title: Title card

Always first. No voiceover (`data-fixed`). Logo, eyebrow, title with swoosh underline on the key phrase.

```html
  <section class="scene light" id="s0_title" data-fixed="3.6" data-nologo>
    <div class="bg-arc"></div>
    <div class="center col">
      <img class="a pop title-logo" style="--d:0.1" src="assets/logo.png" alt="{{BRAND}}">
      <div class="a rise eyebrow" style="--d:0.9">Automation Case Study</div>
      <h1 class="a rise title" style="--d:1.1">Automated Meeting<br><span class="swoosh-wrap">Attendance &amp; AI Notes<svg class="swoosh" viewBox="0 0 600 30" preserveAspectRatio="none"><path class="a draw" style="--d:1.7" d="M5 22 C 150 4, 420 4, 595 18"/></svg></span></h1>
    </div>
  </section>
```

## hook-ring: Hook: statement + chores + ring stat

Opens the story on the pain. Dark. Left: one big line plus 3 short chores that slide in as the VO names them. Right: ring timer with the headline cost figure, popped when the VO says the number.

```html
  <section class="scene dark" id="s1_hook">
    <div class="dots-bg"></div>
    <div class="hook-left">
      <h2 class="a rise big" style="--d:0">Every meeting ends<br>the same way.</h2>
      <div class="chores">
        <div class="a slide chore" style="--d:1.9"><svg><use href="#i-user"/></svg>Take attendance</div>
        <div class="a slide chore" style="--d:2.9"><svg><use href="#i-eye"/></svg>Chase down absentees</div>
        <div class="a slide chore" style="--d:4.2"><svg><use href="#i-doc"/></svg>Turn notes into minutes</div>
      </div>
    </div>
    <div class="hook-right a pop" style="--d:6.3">
      <svg class="ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="ring-bg"/><circle cx="100" cy="100" r="88" class="ring-fg a sweep" style="--d:6.5"/></svg>
      <div class="ring-text"><div class="num">8–10</div><div class="unit">minutes</div></div>
      <div class="ring-cap">lost after every single session</div>
    </div>
  </section>
```

## problem-cards: Problem: three cards

Dark. Exactly 3 cards: number, icon, title, one-sentence detail. `hl` (accent) and `hl2` (alert) outline the card the VO is talking about.

```html
  <section class="scene dark" id="s2_problem">
    <div class="dots-bg"></div>
    <div class="a rise eyebrow light-eyebrow problem-eyebrow" style="--d:-0.3">The Problem</div>
    <div class="cards3">
      <div class="a rise pcard" style="--d:0">
        <div class="pnum">01</div><svg class="picon"><use href="#i-clock"/></svg>
        <h3>Administrative overhead</h3><p>8–10 minutes of manual attendance and note clean-up after every meeting.</p>
      </div>
      <div class="a rise pcard hl" style="--d:0.6">
        <div class="pnum">02</div><svg class="picon"><use href="#i-spark"/></svg>
        <h3>Fragmented AI tools</h3><p>AI notetakers captured the talk, but no unified attendance or participant telemetry.</p>
      </div>
      <div class="a rise pcard hl2" style="--d:5.6">
        <div class="pnum">03</div><svg class="picon"><use href="#i-eye"/></svg>
        <h3>Lack of visibility</h3><p>No central view of attendance duration or presence across team sessions.</p>
      </div>
    </div>
  </section>
```

## solution-hub: Solution: tool hub

Light. Headline left; orbit with 4 tool nodes (`n1`..`n4`, top/right/bottom/left) and the central engine hub, each popped when the VO names it. Use for "N tools working as one". Icon chip colors: `c-primary`, `c-secondary`, `c-accent`, `c-alert`.

```html
  <section class="scene light" id="s3_solution">
    <div class="bg-arc"></div>
    <div class="sol-head">
      <div class="a rise eyebrow" style="--d:-0.3">The Solution</div>
      <h2 class="a rise h2" style="--d:0">An end-to-end<br><span class="hl-text">meeting intelligence loop</span></h2>
      <p class="a rise lead" style="--d:3.4">Five tools, working as one.</p>
    </div>
    <div class="hub-wrap">
      <svg class="hub-lines" viewBox="0 0 900 900">
        <circle class="a draw orbit" style="--d:3.6" cx="450" cy="450" r="330"/>
        <g class="spin"><circle cx="450" cy="120" r="9" fill="#F5831F"/><circle cx="450" cy="780" r="9" fill="#E02B1F"/></g>
      </svg>
      <div class="hub a pop" style="--d:11.6"><svg><use href="#i-flow"/></svg><b>n8n</b><span>Automation engine</span></div>
      <div class="node a pop n1" style="--d:5.2"><div class="nic c-primary"><svg><use href="#i-cal"/></svg></div><b>Google Calendar</b><span>Trigger · events &amp; invitees</span></div>
      <div class="node a pop n2" style="--d:6.7"><div class="nic c-secondary"><svg><use href="#i-video"/></svg></div><b>Google Meet v2 API</b><span>Participant telemetry</span></div>
      <div class="node a pop n3" style="--d:8.8"><div class="nic c-accent"><svg><use href="#i-folder"/></svg></div><b>Drive &amp; Docs API</b><span>Find &amp; update notes</span></div>
      <div class="node a pop n4" style="--d:10.2"><div class="nic c-alert"><svg><use href="#i-spark"/></svg></div><b>Fathom AI</b><span>Record &amp; summarize</span></div>
    </div>
  </section>
```

## step-filter-list: Step panel: filter list

Rows of items (`ev ok` kept, `ev no` removed). A scan bar sweeps, kept rows get a check, removed rows get a strike line and a "Filtered" pill, footer gives the count. Use for ingestion, triage, cleanup steps.

```html
  <section class="scene light step" id="s4_step1" data-step="1">
    <div class="stepcol">
      <div class="stepnum a rise" style="--d:-0.3">01</div>
      <h2 class="a rise" style="--d:-0.1">Calendar<br>Ingestion</h2>
      <p class="a rise" style="--d:0.4">A scheduled scan pulls every calendar event, then filters out anything that isn't a real meeting.</p>
      <div class="api a rise" style="--d:0.8"><svg><use href="#i-cal"/></svg>Google Calendar API</div>
    </div>
    <div class="panel a rise" style="--d:0.2">
      <div class="panel-head"><svg><use href="#i-cal"/></svg>Calendar · Oct 12, 2026<span class="scan a scanbar" style="--d:4.3"></span></div>
      <div class="ev a rise ok" style="--d:1.0"><i>09:00</i><b>Weekly Sprint Sync</b><em class="a pop chk" style="--d:5.4"><svg><use href="#i-check"/></svg></em></div>
      <div class="ev a rise no" style="--d:1.25"><i>10:30</i><b>Out of Office<span class="a strike" style="--d:6.6"></span></b><em class="a pop rm" style="--d:6.6">Filtered</em></div>
      <div class="ev a rise ok" style="--d:1.5"><i>11:00</i><b>Client Review · Q4 Roadmap</b><em class="a pop chk" style="--d:5.6"><svg><use href="#i-check"/></svg></em></div>
      <div class="ev a rise no" style="--d:1.75"><i>13:00</i><b>Lunch Break<span class="a strike" style="--d:8.9"></span></b><em class="a pop rm" style="--d:8.9">Filtered</em></div>
      <div class="ev a rise no" style="--d:2.0"><i>13:30</i><b>Prayer Time<span class="a strike" style="--d:7.9"></span></b><em class="a pop rm" style="--d:7.9">Filtered</em></div>
      <div class="ev a rise ok" style="--d:2.25"><i>15:00</i><b>Design Standup</b><em class="a pop chk" style="--d:5.8"><svg><use href="#i-check"/></svg></em></div>
      <div class="panel-foot a rise" style="--d:9.6"><b>6</b> events scanned <span class="arrow">→</span> <b class="o">3</b> real meetings</div>
    </div>
  </section>
```

## step-match-pairs: Step panel: match pairs

Two columns of cards linked by drawn lines with tags naming the match rule. Use for matching, reconciliation, sync steps. See "Match-pairs geometry" above.

```html
  <section class="scene light step" id="s5_step2" data-step="2">
    <div class="stepcol">
      <div class="stepnum a rise" style="--d:-0.3">02</div>
      <h2 class="a rise" style="--d:-0.1">Conference<br>Record Matching</h2>
      <p class="a rise" style="--d:0.4">Actual Meet call records are matched to calendar events by meeting code or start-time proximity.</p>
      <div class="api a rise" style="--d:0.8"><svg><use href="#i-video"/></svg>Google Meet v2 API</div>
    </div>
    <div class="panel match">
      <div class="mcol">
        <div class="mh a rise" style="--d:0.2">Calendar events</div>
        <div class="mc a rise" style="--d:0.4"><svg><use href="#i-cal"/></svg><div><b>Weekly Sprint Sync</b><span>09:00 · code kxq-mfbt-zra</span></div></div>
        <div class="mc a rise" style="--d:0.6"><svg><use href="#i-cal"/></svg><div><b>Client Review · Q4</b><span>11:00 · code pwe-hutn-bqa</span></div></div>
        <div class="mc a rise" style="--d:0.8"><svg><use href="#i-cal"/></svg><div><b>Design Standup</b><span>15:00 · no code</span></div></div>
      </div>
      <svg class="mlines" viewBox="0 0 220 480" preserveAspectRatio="none">
        <path class="a draw" style="--d:5.0" d="M0 178 L 220 178"/>
        <path class="a draw" style="--d:5.5" d="M0 308 L 220 308"/>
        <path class="a draw dashed" style="--d:6.0" d="M0 438 L 220 438"/>
      </svg>
      <div class="mtags">
        <span class="mt a pop" style="--d:7.2;top:162px">meeting code</span>
        <span class="mt a pop" style="--d:7.5;top:292px">meeting code</span>
        <span class="mt o a pop" style="--d:8.8;top:422px">start-time proximity</span>
      </div>
      <div class="mcol">
        <div class="mh a rise" style="--d:1.6">Meet conference records</div>
        <div class="mc dark a rise" style="--d:2.0"><svg><use href="#i-video"/></svg><div><b>kxq-mfbt-zra</b><span>started 09:01</span></div></div>
        <div class="mc dark a rise" style="--d:2.4"><svg><use href="#i-video"/></svg><div><b>pwe-hutn-bqa</b><span>started 11:02</span></div></div>
        <div class="mc dark a rise" style="--d:2.8"><svg><use href="#i-video"/></svg><div><b>zjr-kdoe-vnm</b><span>started 15:03</span></div></div>
      </div>
      <div class="panel-foot a rise" style="--d:9.2"><b>3</b> of 3 events <span class="arrow">→</span> <b class="o">matched</b> to real call records</div>
    </div>
  </section>
```

## step-timeline: Step panel: timeline / Gantt

Rows with bars that grow along a time axis, live HH:MM:SS counters (`.count data-fmt="hms"`), an absent row, and a `botzone` row that moves below a dashed divider (exclusion). Use for durations, telemetry, SLAs.

```html
  <section class="scene light step" id="s6_step3" data-step="3">
    <div class="stepcol">
      <div class="stepnum a rise" style="--d:-0.3">03</div>
      <h2 class="a rise" style="--d:-0.1">Participant<br>Telemetry</h2>
      <p class="a rise" style="--d:0.4">Exact join and leave times, total presence in HH:MM:SS, and AI bots isolated from human attendance.</p>
      <div class="api a rise" style="--d:0.8"><svg><use href="#i-clock"/></svg>Meet v2 · participant sessions</div>
    </div>
    <div class="panel gantt">
      <div class="panel-head a rise" style="--d:0.2"><svg><use href="#i-video"/></svg>Weekly Sprint Sync · 09:00 – 10:00</div>
      <div class="gaxis a rise" style="--d:0.4"><span>09:00</span><span>09:15</span><span>09:30</span><span>09:45</span><span>10:00</span></div>
      <div class="grow a rise" style="--d:0.8"><div class="gname">Aisha Khan</div><div class="gtrack"><i class="a grow-x" style="--d:2.0;left:0%;width:99%"></i></div><div class="gdur"><span class="count" data-fmt="hms" data-to="3581" data-d="4.6" data-len="2"></span></div></div>
      <div class="grow a rise" style="--d:1.0"><div class="gname">Daniel Ruiz</div><div class="gtrack"><i class="a grow-x" style="--d:2.2;left:7%;width:90%"></i></div><div class="gdur"><span class="count" data-fmt="hms" data-to="3252" data-d="4.6" data-len="2"></span></div></div>
      <div class="grow a rise" style="--d:1.2"><div class="gname">Priya Shah</div><div class="gtrack"><i class="a grow-x" style="--d:2.4;left:0%;width:52%"></i><i class="a grow-x" style="--d:2.9;left:60%;width:40%"></i></div><div class="gdur"><span class="count" data-fmt="hms" data-to="3287" data-d="4.6" data-len="2"></span></div></div>
      <div class="grow absent a rise" style="--d:1.4"><div class="gname">Marco Lee</div><div class="gtrack"><em class="a pop" style="--d:3.4">Absent</em></div><div class="gdur">00:00:00</div></div>
      <div class="botzone">
        <div class="botsep a fade" style="--d:8.6">AI notetakers · excluded from attendance</div>
        <div class="grow bot a botmove" style="--d:8.4"><div class="gname"><svg><use href="#i-bot"/></svg>Fathom bot</div><div class="gtrack"><i class="a grow-x" style="--d:2.6;left:0%;width:100%"></i></div><div class="gdur">bot</div></div>
      </div>
    </div>
  </section>
```

## step-resolve: Step panel: resolve / lookup

Breadcrumb path highlighting the target, input variants flying into an engine box, then the matched item in a list. Use for lookup, normalization, routing steps.

```html
  <section class="scene light step" id="s7_step4" data-step="4">
    <div class="stepcol">
      <div class="stepnum a rise" style="--d:-0.3">04</div>
      <h2 class="a rise" style="--d:-0.1">Folder &amp; Doc<br>Resolution</h2>
      <p class="a rise" style="--d:0.4">Finds the meeting's Drive folder, then a multi-format date engine pairs today's session with its Gemini Notes doc.</p>
      <div class="api a rise" style="--d:0.8"><svg><use href="#i-folder"/></svg>Google Drive &amp; Docs API</div>
    </div>
    <div class="panel resolve">
      <div class="crumbs">
        <span class="a rise" style="--d:0.3"><svg><use href="#i-folder"/></svg>Drive</span><em class="a fade" style="--d:0.6">›</em>
        <span class="a rise" style="--d:0.8"><svg><use href="#i-folder"/></svg>Meeting Attendance &amp; Recordings</span><em class="a fade" style="--d:1.1">›</em>
        <span class="a rise act" style="--d:1.4"><svg><use href="#i-folder"/></svg>Weekly Sprint Sync</span>
      </div>
      <div class="dates">
        <span class="dchip a fly1" style="--d:3.6">2026/10/12</span>
        <span class="dchip a fly2" style="--d:3.9">2026-10-12</span>
        <span class="dchip a fly3" style="--d:4.2">Oct 12</span>
      </div>
      <div class="engine a pop" style="--d:3.2"><svg><use href="#i-target"/></svg><div><b>Date engine</b><span>normalized → 2026-10-12</span></div></div>
      <div class="docs">
        <div class="dcard a rise" style="--d:2.0"><svg><use href="#i-doc"/></svg>Weekly Sprint Sync · Oct 5 · Notes by Gemini</div>
        <div class="dcard win a rise" style="--d:2.2"><svg><use href="#i-doc"/></svg>Weekly Sprint Sync · Oct 12 · Notes by Gemini<em class="a pop" style="--d:6.6"><svg><use href="#i-check"/></svg>Matched</em></div>
        <div class="dcard a rise" style="--d:2.4"><svg><use href="#i-doc"/></svg>Weekly Sprint Sync · Oct 19 · Notes by Gemini</div>
      </div>
    </div>
  </section>
```

## step-two-phase: Step panel: two phases

Phase A (AI transform: raw input, AI chip, structured sections) fades out at a cue; phase B (guard condition, pass/block items, flow line, batch progress) takes over. Use when one VO line covers two actions.

```html
  <section class="scene light step" id="s8_step5" data-step="5">
    <div class="stepcol">
      <div class="stepnum a rise" style="--d:-0.3">05</div>
      <h2 class="a rise" style="--d:-0.1">AI Notes &amp;<br>Batch Update</h2>
      <p class="a rise" style="--d:0.4">Fathom notes are formatted by AI. A filter guard blocks ad-hoc calls before the batch update writes the doc.</p>
      <div class="api a rise" style="--d:0.8"><svg><use href="#i-spark"/></svg>Fathom AI + If node</div>
    </div>
    <div class="panel two">
      <div class="phaseA a fadeout" style="--d:5.6">
        <div class="raw a rise" style="--d:0.4"><div class="rh"><svg><use href="#i-spark"/></svg>Fathom raw summary</div><i></i><i style="width:80%"></i><i style="width:92%"></i><i style="width:64%"></i><i style="width:86%"></i></div>
        <div class="ai a pop" style="--d:1.8"><svg><use href="#i-spark"/></svg>AI formatting</div>
        <div class="secs">
          <div class="sec a slide" style="--d:2.4">Meeting summary</div>
          <div class="sec a slide" style="--d:3.0">Key discussion points</div>
          <div class="sec a slide" style="--d:3.6">Decisions</div>
          <div class="sec a slide" style="--d:4.2">Action items</div>
        </div>
      </div>
      <div class="phaseB">
        <div class="call a rise" style="--d:6.3"><svg><use href="#i-video"/></svg>Ad-hoc call · no recording<em class="a pop bad" style="--d:8.3"><svg><use href="#i-x"/></svg></em></div>
        <div class="call a rise" style="--d:6.6"><svg><use href="#i-video"/></svg>Weekly Sprint Sync<em class="a pop good" style="--d:8.9"><svg><use href="#i-check"/></svg></em></div>
        <div class="guard a pop" style="--d:6.0">
          <div class="gh"><svg><use href="#i-filter"/></svg>Filter guard · If node</div>
          <code>attendanceDocumentId <b>≠ null</b></code>
          <code>presentCount <b>&gt; 0</b></code>
        </div>
        <div class="flowline a growy" style="--d:9.0"></div>
        <div class="batch a rise" style="--d:9.6">
          <div class="bh"><svg><use href="#i-doc"/></svg>Batch update → Google Doc</div>
          <div class="bar"><i class="a grow-x" style="--d:10.0;--len:2.2s"></i></div>
          <div class="bdone a pop" style="--d:12.2"><svg><use href="#i-check"/></svg>Attendance + notes written</div>
        </div>
      </div>
    </div>
  </section>
```

## hood-footage: Under the hood: screen recording

Dark. App window playing the prepared frame sequence (`data-footage`, `data-frames` from prep_footage.mjs) plus chips naming the technical pieces as the VO says them.

```html
  <section class="scene dark" id="s9_hood">
    <div class="dots-bg"></div>
    <div class="a rise eyebrow light-eyebrow hood-eyebrow" style="--d:-0.3">Under the hood</div>
    <div class="appwin a pop" style="--d:-0.1">
      <div class="win-bar"><i></i><i></i><i></i><span>n8n · Google Meet Attendance workflow</span></div>
      <img data-footage="assets/footage" data-frames="477" src="assets/footage/f_0001.jpg" alt="">
    </div>
    <div class="hood-chips">
      <span class="a pop hc" style="--d:2.2">Custom JavaScript</span>
      <span class="a pop hc" style="--d:3.9">Timezone normalization</span>
      <span class="a pop hc" style="--d:5.5">Time-window alignment</span>
      <span class="a pop hc" style="--d:7.0">Conditional routing</span>
      <span class="a pop hc o" style="--d:8.0">OAuth2 across Workspace APIs</span>
    </div>
  </section>
```

## output-doc: Output: document mock

Light. Left: headline plus a list that ticks along with the VO. Right: document mock with stat tiles (`.count`), a table, a log and notes; `docscroll` scrolls it to reveal the lower half.

```html
  <section class="scene light" id="s10_output">
    <div class="bg-arc"></div>
    <div class="out-head">
      <div class="a rise eyebrow" style="--d:-0.3">The Output</div>
      <h2 class="a rise h2" style="--d:0.8">One document<br><span class="hl-text">per meeting.</span></h2>
      <ul class="olist">
        <li class="a slide" style="--d:3.6">Attendance summary</li>
        <li class="a slide" style="--d:5.0">Structured attendance table</li>
        <li class="a slide" style="--d:9.6">Full participant log</li>
        <li class="a slide" style="--d:11.0">AI meeting notes</li>
      </ul>
    </div>
    <div class="gdoc a rise" style="--d:1.2">
      <div class="gdoc-bar"><svg><use href="#i-doc"/></svg>Weekly Sprint Sync · Oct 12, 2026 · Notes by Gemini</div>
      <div class="gdoc-page"><div class="gdoc-scroll a docscroll" style="--d:9.2">
        <h4>Attendance Summary</h4>
        <div class="tiles">
          <div class="tile a pop" style="--d:3.6"><b class="count" data-to="4" data-d="3.6" data-len="0.8">0</b><span>Invited</span></div>
          <div class="tile a pop" style="--d:3.8"><b class="count t-primary" data-to="3" data-d="3.8" data-len="0.8">0</b><span>Present</span></div>
          <div class="tile a pop" style="--d:4.0"><b class="count t-alert" data-to="1" data-d="4.0" data-len="0.8">0</b><span>Absent</span></div>
          <div class="tile a pop" style="--d:4.2"><b class="count t-muted" data-to="1" data-d="4.2" data-len="0.8">0</b><span>AI notetaker</span></div>
        </div>
        <h4>Attendance</h4>
        <table>
          <tr class="a fade" style="--d:5.0"><th>Invitee</th><th>Matched participant</th><th>Status</th><th>Join</th><th>Leave</th><th>Duration</th></tr>
          <tr class="a rise" style="--d:5.4"><td>aisha@client.com</td><td>Aisha Khan</td><td><em class="pres">Present</em></td><td>09:00:12</td><td>09:59:53</td><td>00:59:41</td></tr>
          <tr class="a rise" style="--d:5.8"><td>daniel@client.com</td><td>Daniel Ruiz</td><td><em class="pres">Present</em></td><td>09:04:31</td><td>09:58:43</td><td>00:54:12</td></tr>
          <tr class="a rise" style="--d:6.2"><td>priya@client.com</td><td>Priya Shah</td><td><em class="pres">Present</em></td><td>09:00:05</td><td>10:00:00</td><td>00:54:47</td></tr>
          <tr class="a rise" style="--d:6.6"><td>marco@client.com</td><td>—</td><td><em class="abs">Absent</em></td><td>—</td><td>—</td><td>00:00:00</td></tr>
        </table>
        <h4>Participant Log</h4>
        <div class="log"><span>Aisha Khan · 1 session</span><span>Daniel Ruiz · 1 session</span><span>Priya Shah · 2 sessions</span><span class="g">Fathom Notetaker · bot</span></div>
        <h4>Meeting Notes</h4>
        <div class="notes">
          <div><b>Summary</b><i></i><i style="width:84%"></i></div>
          <div><b>Key discussion points</b><i style="width:90%"></i><i style="width:70%"></i></div>
          <div><b>Decisions</b><i style="width:76%"></i></div>
          <div><b>Action items</b><i style="width:88%"></i><i style="width:60%"></i></div>
        </div>
      </div></div>
    </div>
  </section>
```

## results-stats: Results: three big numbers

Blue band. Three stats: counters (`.count`) and a before/after swap (struck old value, popped new value). Every figure must come from the source document.

```html
  <section class="scene blue" id="s11_results">
    <div class="a rise eyebrow light-eyebrow res-eyebrow" style="--d:-0.3">Results &amp; Impact</div>
    <div class="stats">
      <div class="stat a rise" style="--d:0.2">
        <div class="sv"><span class="count" data-to="100" data-d="0.6" data-len="2.4">0</span>%</div>
        <div class="sl">of targeted meetings captured automatically</div>
      </div>
      <div class="stat a rise" style="--d:4.0">
        <div class="sv swap"><span class="before">8–10<i class="a strike" style="--d:6.8"></i></span><span class="after a pop" style="--d:7.6">0<small>min</small></span></div>
        <div class="sl">manual effort to produce minutes, now real-time</div>
      </div>
      <div class="stat a rise" style="--d:9.0">
        <div class="sv">≥<span class="count" data-to="95" data-d="9.4" data-len="2.2">0</span>%</div>
        <div class="sl">attendance precision via Meet v2 API</div>
      </div>
    </div>
  </section>
```

## impact-cards: Impact: three icon cards

Light, centered. Headline plus 3 popped cards for where the saved time goes, or any closing benefit list.

```html
  <section class="scene light" id="s12_impact">
    <div class="bg-arc"></div>
    <div class="center col">
      <div class="a rise eyebrow" style="--d:-0.3">Where the saved time goes</div>
      <h2 class="a rise h2 tc" style="--d:0">Hours back for the<br><span class="hl-text">work that matters.</span></h2>
      <div class="impact">
        <div class="ic a pop" style="--d:1.6"><svg><use href="#i-target"/></svg>Core project deliverables</div>
        <div class="ic a pop" style="--d:2.6"><svg><use href="#i-bot"/></svg>AI agent engineering</div>
        <div class="ic a pop" style="--d:3.8"><svg><use href="#i-rocket"/></svg>Strategic initiatives</div>
      </div>
    </div>
  </section>
```

## cta: Call to action

Always last. Logo, tagline with swoosh, website and phone. `data-tail` holds the end card after the VO.

```html
  <section class="scene light" id="s13_cta" data-tail="4" data-nologo>
    <div class="bg-arc"></div>
    <div class="center col">
      <img class="a pop cta-logo" style="--d:-0.3" src="assets/logo.png" alt="{{BRAND}}">
      <h2 class="a rise h2 tc" style="--d:0.9">Automate the busywork.<br><span class="swoosh-wrap">Focus on growing your business.<svg class="swoosh" viewBox="0 0 600 30" preserveAspectRatio="none"><path class="a draw" style="--d:2.4" d="M5 22 C 150 4, 420 4, 595 18"/></svg></span></h2>
      <div class="a rise contact" style="--d:3.0"><span>{{WEBSITE}}</span><i></i><span>{{PHONE}}</span></div>
    </div>
  </section>
```

## step-chat: Step panel: chat conversation

A conversation that builds message by message: user requests on the right, the assistant or bot on the left, and a typing indicator before each reply. Use for chatbots, Slack or Teams bots, AI assistants and support flows. Keep each message under 15 words.

```html
  <section class="scene light step" id="s06_chat" data-step="3">
    <div class="stepcol">
      <div class="stepnum a rise" style="--d:-0.3">03</div>
      <h2 class="a rise" style="--d:-0.1">Ask the<br>Assistant</h2>
      <p class="a rise" style="--d:0.4">One-sentence description of what happens in this step.</p>
      <div class="api a rise" style="--d:0.8"><svg><use href="#i-spark"/></svg>Tool or API name</div>
    </div>
    <div class="panel">
      <div class="panel-head a rise" style="--d:0.2"><svg><use href="#i-bot"/></svg>Assistant · #channel</div>
      <div class="chat">
        <div class="msg user a rise" style="--d:1.0">What changed in last week's pipeline?</div>
        <div class="typing a fade" style="--d:1.8"><i></i><i></i><i></i></div>
        <div class="msg bot a rise" style="--d:3.0"><svg><use href="#i-spark"/></svg>Three deals moved to closing. One stalled.</div>
        <div class="msg user a rise" style="--d:5.0">Draft the follow-up for the stalled one.</div>
        <div class="msg bot a rise" style="--d:6.6"><svg><use href="#i-spark"/></svg>Done: the draft is in your inbox.</div>
      </div>
    </div>
  </section>
```

## step-checklist: Step panel: checklist

Rows that tick one by one as the VO names them, with an optional tag on the right. Use for validations, onboarding steps, compliance checks and QA gates.

```html
  <section class="scene light step" id="s07_checks" data-step="4">
    <div class="stepcol">
      <div class="stepnum a rise" style="--d:-0.3">04</div>
      <h2 class="a rise" style="--d:-0.1">Automatic<br>Checks</h2>
      <p class="a rise" style="--d:0.4">One-sentence description of what happens in this step.</p>
      <div class="api a rise" style="--d:0.8"><svg><use href="#i-filter"/></svg>Tool or API name</div>
    </div>
    <div class="panel">
      <div class="panel-head a rise" style="--d:0.2"><svg><use href="#i-check"/></svg>Checks before sending</div>
      <div class="checklist">
        <div class="ck a rise" style="--d:0.6"><span class="box"><em class="a pop" style="--d:1.6"><svg><use href="#i-check"/></svg></em></span>Document found<small class="a fade" style="--d:1.8">ok</small></div>
        <div class="ck a rise" style="--d:0.8"><span class="box"><em class="a pop" style="--d:3.0"><svg><use href="#i-check"/></svg></em></span>Attendees present<small class="a fade" style="--d:3.2">ok</small></div>
        <div class="ck a rise" style="--d:1.0"><span class="box"><em class="a pop" style="--d:4.4"><svg><use href="#i-check"/></svg></em></span>Not already processed<small class="a fade" style="--d:4.6">ok</small></div>
        <div class="ck a rise" style="--d:1.2"><span class="box"><em class="a pop" style="--d:5.8"><svg><use href="#i-check"/></svg></em></span>Bots excluded<small class="a fade" style="--d:6.0">ok</small></div>
      </div>
      <div class="panel-foot a rise" style="--d:6.8"><b>4</b> of 4 checks <span class="arrow">→</span> <b class="o">passed</b></div>
    </div>
  </section>
```

## step-formfill: Step panel: template fill

A template whose fields fill in one at a time: the value "types in" from left to right. Use `tok` on a value to show it as a template token before it is filled. Use for document generation, mail merge, proposals, invoices and report templates.

```html
  <section class="scene light step" id="s08_fill" data-step="5">
    <div class="stepcol">
      <div class="stepnum a rise" style="--d:-0.3">05</div>
      <h2 class="a rise" style="--d:-0.1">Fill the<br>Template</h2>
      <p class="a rise" style="--d:0.4">One-sentence description of what happens in this step.</p>
      <div class="api a rise" style="--d:0.8"><svg><use href="#i-doc"/></svg>Tool or API name</div>
    </div>
    <div class="panel">
      <div class="panel-head a rise" style="--d:0.2"><svg><use href="#i-doc"/></svg>Proposal template</div>
      <div class="formfill">
        <div class="ff-row a rise" style="--d:0.6"><b>Client</b><span class="ff-val a typein" style="--d:1.4">Northwind Traders</span></div>
        <div class="ff-row a rise" style="--d:0.8"><b>Project</b><span class="ff-val a typein" style="--d:2.6">Warehouse automation</span></div>
        <div class="ff-row a rise" style="--d:1.0"><b>Start date</b><span class="ff-val a typein" style="--d:3.8">Nov 3, 2026</span></div>
        <div class="ff-row a rise" style="--d:1.2"><b>Total</b><span class="ff-val tok a fade" style="--d:1.2">{{total}}</span></div>
      </div>
      <div class="panel-foot a rise" style="--d:6.0"><b>4</b> fields <span class="arrow">→</span> <b class="o">ready to send</b></div>
    </div>
  </section>
```

## Scenes between steps

A non-step scene can sit between two step scenes (for example "safeguards" after step 5). Give it `class="scene light step-aside" data-after="5"`: it shows the "How it works" tracker with steps 1 to 5 done and none active, so viewers know the walkthrough is paused, not finished.

## Custom panels

When no step panel fits, write a new one inside the step scene's `<div class="panel">`:

1. Sketch it as 3 to 6 elements that appear in the order the VO mentions them.
2. Reuse existing classes first (`ev`, `mc`, `grow`, `dcard`, `sec`, `call`, `guard`, `batch`, `tile`). Add new CSS at the end of the project's `src/base.css` under a `/* custom: <scene id> */` comment, using brand tokens only.
3. Render stills at the scene's start, middle and end (`render.mjs --stills`) and check overlap, clipping and text wrap before the full render.
4. If the panel works well, copy it back into this catalog so the next project can reuse it.
