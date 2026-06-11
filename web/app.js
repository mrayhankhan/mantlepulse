// MantlePulse — zero-dependency cinematic dashboard. Fetches ./feed.json.
const REFRESH_MS = 15000;
const $ = (s) => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let getRisk = () => 20;

/* ---------- helpers ---------- */
const healthColor = (h) => (h >= 80 ? "#34e3b0" : h >= 60 ? "#9be37a" : h >= 40 ? "#f5c451" : "#ff5d6c");
function relTime(ts) {
  const s = Math.max(1, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
const fmtNum = (v) => (typeof v === "number" && Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : v);
function sparkline(history, color) {
  const data = history && history.length ? history : [0];
  const w = 240, h = 70, pad = 3;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((v, i) => `${(pad + i * step).toFixed(1)},${(pad + (h - pad * 2) * (1 - (v - min) / range)).toFixed(1)}`);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline stroke="${color}" points="${pts.join(" ")}"/></svg>`;
}
function countUp(el, target, d = 0) {
  if (reduced) { el.textContent = d ? target.toFixed(d) : Math.round(target).toLocaleString(); return; }
  const dur = 900, start = performance.now();
  (function step(now) {
    const p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3), v = target * e;
    el.textContent = d ? v.toFixed(d) : Math.round(v).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}

/* ---------- preloader ---------- */
function hidePre() { const p = $("#preloader"); if (p) p.classList.add("done"); }
addEventListener("load", () => setTimeout(hidePre, reduced ? 0 : 1700));
setTimeout(hidePre, 4200);

/* ---------- custom cursor ---------- */
function initCursor() {
  if (!matchMedia("(pointer:fine)").matches) return;
  const dot = $("#cdot"), ring = $("#cring");
  let rx = 0, ry = 0, tx = 0, ty = 0;
  addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
  });
  (function loop() { rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  document.addEventListener("mouseover", (e) => {
    ring.classList.toggle("hot", !!e.target.closest("a,button,.tile,.vcard,[role=button]"));
  });
}

/* ---------- scroll: progress, nav, parallax ---------- */
function onScroll() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  $("#progress").style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  $("#nav").classList.toggle("show", y > innerHeight * 0.7);
  const v = $("#heroVideo");
  if (v && y < innerHeight && !reduced) v.style.transform = `scale(1.06) translateY(${y * 0.18}px)`;
}

/* ---------- reveal ---------- */
function initReveal() {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
}

/* ---------- hero ECG (reactive heartbeat) ---------- */
function initHeroEcg() {
  const c = $("#heroEcg"); if (!c) return;
  const ctx = c.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; };
  size(); addEventListener("resize", size);
  let phase = 0;
  function frame() {
    const w = c.width, h = c.height; ctx.clearRect(0, 0, w, h);
    const amp = 0.12 + (getRisk() / 100) * 0.5;
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#34e3b000"); g.addColorStop(0.5, "#34e3b0"); g.addColorStop(1, "#3aa0ff");
    ctx.strokeStyle = g; ctx.lineWidth = 2 * dpr; ctx.beginPath();
    const n = 260;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w;
      let y = Math.sin((i / n) * 8 * Math.PI + phase * 3) * 0.06;
      const beat = ((i / n) * 5 + phase) % 1;
      if (beat > 0.46 && beat < 0.54) y += Math.sin(((beat - 0.46) / 0.08) * Math.PI) * amp * (beat < 0.5 ? 1 : -0.5);
      const yy = h / 2 - y * h;
      i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
    phase += 0.006;
    if (!reduced) requestAnimationFrame(frame);
  }
  frame();
}

/* ---------- bento tiles ---------- */
function vitalsTile(feed) {
  const h = feed.stats.avgHealth, color = healthColor(h), r = 58, circ = 2 * Math.PI * r;
  return `<div class="tile vitals t-span2 t-row2">
    <div class="tile-label">System health</div>
    <div class="big">
      <div class="ring"><svg width="132" height="132" viewBox="0 0 132 132">
        <circle class="track" cx="66" cy="66" r="${r}"></circle>
        <circle class="fill" cx="66" cy="66" r="${r}" stroke="${color}" style="color:${color}" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${circ.toFixed(1)}" data-off="${(circ * (1 - h / 100)).toFixed(1)}"></circle>
      </svg><div class="rnum"><span class="v" data-count="${h}" data-d="1" style="color:${color}">0</span><span class="l">/100 avg</span></div></div>
      <div style="flex:1"><div class="mini-stats">
        <div class="ms"><div class="n" data-count="${feed.stats.totalSignals}">0</div><div class="k">signals</div></div>
        <div class="ms"><div class="n" data-count="${feed.stats.anomalies}">0</div><div class="k">anomalies</div></div>
        <div class="ms"><div class="n" data-count="${feed.stats.protocols}">0</div><div class="k">protocols</div></div>
      </div></div>
    </div></div>`;
}
function protoTile(p, feat, feed) {
  const color = healthColor(p.health), live = p.source === "live" || p.source === "onchain";
  const srcLabel = p.source === "live" ? "LIVE" : p.source === "onchain" ? "ON-CHAIN" : "SIM";
  const tx = p.txHash && feed.explorer ? `<a href="${feed.explorer}/tx/${p.txHash}" target="_blank" rel="noopener" style="color:var(--accent-2);text-decoration:none">tx ↗</a>` : "";
  const mean = p.pctVsBaseline > -100 ? p.value / (1 + p.pctVsBaseline / 100) : p.value;
  return `<div class="tile proto ${feat ? "feat t-span2 t-row2" : ""} ${p.anomaly ? "anomaly" : ""}" tabindex="0" role="button" aria-expanded="false">
    <div class="p-top"><span class="p-name">${p.label}</span>${p.anomaly ? '<span class="tag-anom">⚠ ANOMALY</span>' : `<span class="src ${live ? "live" : ""}">${srcLabel}</span>`}</div>
    <div class="p-health"><span class="hv" style="color:${color}">${p.health.toFixed(feat ? 1 : 0)}</span><span class="hs">/100</span></div>
    <div class="p-metric">${(live ? srcLabel + " · " : "") + p.metric.replace(/_/g, " ")}</div>
    ${sparkline(p.history, color)}
    ${feat ? `<div class="p-msg">${p.message}</div>` : ""}
    <div class="p-meta"><span>risk <b>${p.risk.toFixed(1)}</b></span><span>z <b>${p.z}</b></span><span>Δ <b>${p.pctVsBaseline}%</b></span>${tx}<span class="why-btn">why? ▾</span></div>
    <div class="reason"><div class="reason-inner"><b>How the agent scored this</b><br>current ${p.metric.replace(/_/g, " ")} = <b>${fmtNum(p.value)}</b><br>rolling baseline ≈ <b>${fmtNum(Math.round(mean * 100) / 100)}</b><br>deviation = <b>${p.z}σ</b> · anomaly threshold 2.5σ<br>verdict: <b style="color:${color}">${p.anomaly ? "ANOMALY — breaks pattern" : "within normal range"}</b></div></div>
  </div>`;
}
const consoleTile = () => `<div class="tile console-tile t-span2 t-row2"><div class="ct-head"><span class="dot-r"></span><span class="tile-label" style="color:var(--text)">Agent console — live reasoning</span></div><div id="console" class="console" aria-live="polite"></div></div>`;
function alertsTile(feed) {
  const inner = feed.alerts.length
    ? feed.alerts.map((a) => {
        const tx = a.txHash && feed.explorer ? `<div style="margin-top:6px"><a href="${feed.explorer}/tx/${a.txHash}" target="_blank" rel="noopener">verify on-chain ↗</a></div>` : "";
        return `<div class="alert"><div class="a-top"><span class="a-name">${a.label}</span><span class="a-time">${relTime(a.ts)}</span></div><div class="a-msg">${a.message}</div>${tx}</div>`;
      }).join("")
    : `<div class="empty">All protocols nominal. ✅</div>`;
  return `<div class="tile t-span2 t-row2"><div class="tile-label" style="margin-bottom:12px">Anomaly feed · verifiable</div><div class="alerts">${inner}</div></div>`;
}

function renderBento(feed) {
  const p = feed.protocols;
  if (!p.length) { $("#bento").innerHTML = `<div class="tile t-span2">No signals yet — run the agent.</div>`; return; }
  const feat = p[0], minis = p.slice(1, 5);
  $("#bento").innerHTML = [vitalsTile(feed), protoTile(feat, true, feed), ...minis.map((m) => protoTile(m, false, feed)), consoleTile(), alertsTile(feed)].join("");
  requestAnimationFrame(() => document.querySelectorAll("#bento .ring .fill").forEach((el) => (el.style.strokeDashoffset = el.dataset.off)));
  document.querySelectorAll("#bento [data-count]").forEach((el) => countUp(el, +el.dataset.count, +(el.dataset.d || 0)));
  document.querySelectorAll(".tile").forEach((t) =>
    t.addEventListener("mousemove", (e) => { const r = t.getBoundingClientRect(); t.style.setProperty("--mx", e.clientX - r.left + "px"); t.style.setProperty("--my", e.clientY - r.top + "px"); })
  );
  document.querySelectorAll("#bento .tile.proto").forEach((tile) => {
    const cue = tile.querySelector(".why-btn");
    const toggle = () => { const open = tile.classList.toggle("open"); tile.setAttribute("aria-expanded", open); if (cue) cue.textContent = open ? "why? ▴" : "why? ▾"; };
    tile.addEventListener("click", (e) => { if (e.target.closest("a")) return; toggle(); });
    tile.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });
  attachTilt();
  streamConsole(buildLines(feed));
}

function renderTicker(feed) {
  const items = feed.protocols.map((p) => `<span class="tk ${p.anomaly ? "warn" : ""}">${p.anomaly ? "⚠" : "●"} ${p.label} <b>${p.health.toFixed(0)}/100</b> · z=${p.z}</span>`);
  $("#tickerTrack").innerHTML = items.concat(items).join("");
}
function renderVerify(feed) {
  const ex = feed.explorer, c = feed.contracts || {};
  const link = (a) => (ex && a ? `<a href="${ex}/address/${a}" target="_blank" rel="noopener">${a.slice(0, 12)}…${a.slice(-8)}</a>` : `<span style="color:var(--muted)">deploy pending</span>`);
  $("#verifyGrid").innerHTML = `
    <div class="vcard"><div class="vk">Signals on-chain</div><div class="vbig">${feed.stats.totalSignals.toLocaleString()}</div><div class="vk" style="margin-top:8px">${feed.deployed ? "recorded on " + feed.network : "(deploy pending)"}</div></div>
    <div class="vcard"><div class="vk">SignalRegistry</div><div class="vv">${link(c.SignalRegistry)}</div></div>
    <div class="vcard"><div class="vk">Agent identity · ERC-8004</div><div class="vv">${link(c.AgentIdentityRegistry)}</div><div class="vk" style="margin-top:8px">AgentID ${feed.agentId ? "#" + feed.agentId : "—"}</div></div>`;
}
function renderFooter(feed) {
  $("#footer").innerHTML = `<div>© 2026 <b>MantlePulse</b> · autonomous AI agent on Mantle</div><div>Turing Test Hackathon · ${feed.deployed ? '<b style="color:var(--accent)">live on ' + feed.network + "</b>" : "deploy pending"}</div>`;
}
function renderNet(feed) { $("#navStatus").textContent = feed.deployed ? "● " + feed.network : "● live"; }

/* ---------- agent console ---------- */
let consoleGen = 0;
function buildLines(feed) {
  const L = [{ t: `▸ scanning Mantle · ${feed.protocols.length} targets · ${new Date().toLocaleTimeString()}`, c: "" }];
  for (const p of feed.protocols) {
    L.push({ t: `▸ ${p.label}: ${p.metric.replace(/_/g, " ")}=${fmtNum(p.value)} [${p.source === "simulated" ? "sim" : "live"}] z=${p.z}`, c: p.anomaly ? "warn" : "" });
    if (p.anomaly) L.push({ t: `  ⚠ anomaly: Δ ${p.pctVsBaseline}% vs baseline — flagging`, c: "bad" });
  }
  L.push({ t: `▸ recording ${feed.protocols.length} signals → SignalRegistry ${feed.deployed ? "(" + feed.network + ")" : "(deploy pending)"}`, c: "ok" });
  L.push({ t: `✓ cycle complete · avg health ${feed.stats.avgHealth}/100`, c: "ok" });
  return L;
}
function streamConsole(lines) {
  const gen = ++consoleGen, el = $("#console");
  if (!el) return;
  el.innerHTML = "";
  let i = 0;
  (function next() {
    if (gen !== consoleGen || !document.body.contains(el)) return;
    if (i >= lines.length) { el.insertAdjacentHTML("beforeend", `<span class="cursor"></span>`); return; }
    const d = document.createElement("div");
    d.className = "ln " + lines[i].c; d.textContent = lines[i].t; el.appendChild(d);
    while (el.children.length > 11) el.removeChild(el.firstChild);
    i++; setTimeout(next, reduced ? 0 : 360);
  })();
}

/* ---------- toasts ---------- */
let lastTop = null;
function maybeToast(feed) {
  const top = feed.alerts[0]; if (!top) return;
  const id = top.ts + top.label;
  if (lastTop === null) { lastTop = id; return; }
  if (id !== lastTop) {
    lastTop = id;
    const t = document.createElement("div"); t.className = "toast";
    t.innerHTML = `<div class="t-title">⚠ Anomaly detected</div><div class="t-body">${top.message}</div>`;
    $("#toasts").appendChild(t); setTimeout(() => t.remove(), 7000);
  }
}

/* ---------- featured tile 3D tilt ---------- */
function attachTilt() {
  if (reduced || !matchMedia("(pointer:fine)").matches) return;
  const f = document.querySelector(".tile.feat");
  if (!f) return;
  f.addEventListener("mousemove", (e) => {
    const r = f.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    f.style.transform = `perspective(1400px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateZ(16px)`;
  });
  f.addEventListener("mouseleave", () => { f.style.transform = ""; });
}

/* ---------- sound on beat (Web Audio, $0) ---------- */
let audioCtx = null, soundOn = false, soundTimer = null;
function thump(freq, t0, dur, gain) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = "sine"; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
  const now = audioCtx.currentTime + t0;
  g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(gain, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.start(now); o.stop(now + dur + 0.03);
}
function beat() { if (soundOn && audioCtx) { thump(70, 0, 0.18, 0.16); thump(52, 0.18, 0.22, 0.1); } }
function initSound() {
  const b = $("#soundToggle"); if (!b) return;
  b.addEventListener("click", () => {
    soundOn = !soundOn; b.classList.toggle("on", soundOn); b.setAttribute("aria-pressed", soundOn); b.textContent = soundOn ? "🔊 pulse" : "🔈 pulse";
    if (soundOn) { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); beat(); soundTimer = setInterval(beat, 1100); }
    else clearInterval(soundTimer);
  });
}

/* ---------- main ---------- */
let lastGen = null;
async function load() {
  try {
    const res = await fetch(`./feed.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const feed = await res.json();
    getRisk = () => 100 - (feed.stats.avgHealth || 80);
    if (feed.generatedAt === lastGen) return;
    lastGen = feed.generatedAt;
    renderNet(feed);
    renderTicker(feed);
    renderBento(feed);
    renderVerify(feed);
    renderFooter(feed);
    maybeToast(feed);
  } catch {
    $("#navStatus").textContent = "feed unavailable";
  }
}

initCursor();
initReveal();
initHeroEcg();
addEventListener("scroll", onScroll, { passive: true });
onScroll();
load();
setInterval(load, REFRESH_MS);
