// Deterministic timeline player. window.seek(t) puts every scene at time t (seconds).
//
// Scenes are the <section class="scene"> children of #stage, in document order.
// - A scene with a voiceover (window.VO[id]) lasts LEAD + VO + TAIL (+ data-tail seconds).
// - A scene without voiceover needs data-fixed="<seconds>".
// - Cue times (--d, data-d) are seconds after the scene's VO starts. They were authored against the
//   VO lengths in window.VO_REF, and stretch by VO / VO_REF so visuals stay on the spoken words
//   when the voiceover is regenerated.
// - Footage: <img data-footage="assets/footage" data-frames="N"> plays frames f_0001.jpg..f_N.jpg
//   across its scene.
// - Light scenes get the brand corner logo unless they carry data-nologo.
// - .step scenes get a progress tracker (data-step = this step's number). A scene between steps
//   (for example safeguards after step 5) can carry class "step-aside" and data-after="5": it shows
//   the tracker with steps 1-5 done and none active.
(function () {
  const LEAD = 0.7, TAIL = 0.9, XFADE = 0.5;
  const VO = window.VO || {}, REF = window.VO_REF || {};

  let t = 0;
  const scenes = [...document.querySelectorAll('#stage > section.scene')].map((el) => {
    const id = el.id, vo = VO[id];
    const fixed = el.dataset.fixed != null ? +el.dataset.fixed : null;
    if (vo == null && fixed == null) throw new Error(`Scene "${id}" has no voiceover and no data-fixed`);
    const dur = fixed != null ? fixed : LEAD + vo + TAIL + (+el.dataset.tail || 0);
    const s = {
      id, el, start: t, voStart: t + (vo != null ? LEAD : 0), vo: vo || 0, end: t + dur,
      k: vo != null && REF[id] ? vo / REF[id] : 1,
      counts: [...el.querySelectorAll('.count')], footage: el.querySelector('img[data-footage]'),
    };
    el.style.setProperty('--v0', s.voStart + 's');
    el.style.setProperty('--k', s.k);
    t += dur;
    return s;
  });
  window.TIMELINE = scenes.map(({ id, start, voStart, vo, end, k }) => ({ id, start, voStart, vo, end, k }));
  window.DURATION = t;

  const clamp = (x) => Math.max(0, Math.min(1, x));
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const pad = (n) => String(n).padStart(2, '0');
  const hms = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(Math.floor(s % 60))}`;

  // Paths drawn via dashoffset need a normalized length.
  document.querySelectorAll('.draw').forEach((p) => p.setAttribute('pathLength', '1'));

  scenes.forEach((s) => {
    if (s.el.classList.contains('light') && !('nologo' in s.el.dataset)) {
      const img = document.createElement('img');
      img.src = 'assets/logo.png'; img.className = 'corner-logo';
      s.el.appendChild(img);
    }
  });

  const steps = document.querySelectorAll('.step');
  document.querySelectorAll('.step, .step-aside').forEach((el) => {
    // An aside after step N: steps 1..N done, none active.
    const n = el.classList.contains('step-aside') ? +el.dataset.after + 0.5 : +el.dataset.step;
    const tr = document.createElement('div');
    tr.className = 'tracker';
    tr.innerHTML = '<span class="lab">HOW IT WORKS</span>' +
      [...steps].map((_, i) => `<i class="${i + 1 < n ? 'done' : i + 1 === n ? 'on' : ''}"></i>`).join('');
    el.appendChild(tr);
  });

  const frameSrc = (img, i) => `${img.dataset.footage}/f_${String(i).padStart(4, '0')}.jpg`;
  const preload = scenes.filter((s) => s.footage).flatMap((s) =>
    Array.from({ length: +s.footage.dataset.frames }, (_, i) => {
      const im = new Image(); im.src = frameSrc(s.footage, i + 1); return im.decode().catch(() => {});
    }));
  window.READY = Promise.all([document.fonts.ready, ...preload]).then(() => true);

  window.seek = async function (time) {
    for (const s of scenes) {
      const visible = time >= s.start - 0.01 && time < s.end + XFADE;
      s.el.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) continue;
      const k = easeOut(clamp((time - s.start) / XFADE));
      s.el.style.opacity = s.start === 0 ? 1 : k;
      s.el.style.transform = `scale(${1.025 - 0.025 * k})`;
      for (const c of s.counts) {
        const p = easeOut(clamp((time - s.voStart - +c.dataset.d * s.k) / +c.dataset.len));
        const from = +c.dataset.from || 0;
        const v = from + p * (+c.dataset.to - from);
        c.textContent = c.dataset.fmt === 'hms' ? hms(v) : Math.round(v);
      }
    }
    document.getAnimations().forEach((a) => { a.pause(); a.currentTime = time * 1000; });

    for (const s of scenes) {
      if (!s.footage || time < s.start || time >= s.end + XFADE) continue;
      const n = +s.footage.dataset.frames;
      const p = clamp((time - s.start) / (s.end - s.start));
      const src = frameSrc(s.footage, 1 + Math.min(n - 1, Math.floor(p * n)));
      if (!s.footage.src.endsWith(src)) { s.footage.src = src; await s.footage.decode().catch(() => {}); }
    }
  };

  // Preview mode: fit stage to window, ?t=SECONDS to jump, ?play=1 to play in real time.
  const q = new URLSearchParams(location.search);
  if (!q.has('render')) {
    const fit = () => {
      const s = Math.min(innerWidth / 1920, innerHeight / 1080);
      document.getElementById('stage').style.transform = `scale(${s})`;
    };
    addEventListener('resize', fit); fit();
    window.READY.then(() => {
      const t0 = +(q.get('t') || 0);
      if (q.has('play')) {
        const base = performance.now() - t0 * 1000;
        const loop = () => { window.seek((performance.now() - base) / 1000 % window.DURATION); requestAnimationFrame(loop); };
        loop();
      } else window.seek(t0);
    });
  }
})();
