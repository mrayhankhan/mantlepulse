# Optional premium assets (auto-detected)

The dashboard looks great **without** any of these — but drop them in this folder
and they activate automatically. All optional.

| File | What it does | How it's used |
|---|---|---|
| `hero.mp4` | Background ambient video | Auto-detected by `app.js`; fades in behind the UI, particle canvas dims |
| `og.png` | Social share card (1200×630) | Used as the `og:image` for X/Telegram link previews |
| `logo.png` | Custom logo (optional) | Swap into the `.logo` element in `index.html` if you prefer it over the CSS mark |

---

## 🎬 Veo prompt — `hero.mp4` (background loop)

> A dark, premium fintech background. Slowly drifting 3D network of glowing
> teal-green nodes connected by thin luminous cyan lines, with faint data
> particles flowing along the connections. Deep navy-to-black gradient backdrop,
> soft volumetric glow, subtle depth-of-field. Calm, cinematic, abstract — no
> text, no logos, no people. Seamless loop, very slow motion. 16:9, 1920×1080.

Keep it **subtle and dark** (it sits behind text). 8–12s seamless loop. Export MP4, save as `web/assets/hero.mp4`.

## 🖼️ Gemini / Imagen prompt — `og.png` (social card, 1200×630)

> Sleek dark dashboard hero graphic for a product called "MantlePulse".
> Centered wordmark "MantlePulse" in clean bold sans-serif, white with a
> teal-to-blue gradient on "Pulse". Tagline below: "On-chain AI health
> intelligence for Mantle DeFi". Background: dark navy with a faint glowing
> heartbeat/ECG line in teal and a subtle node-network motif. Minimal, premium,
> high contrast. 1200×630, no clutter.

## 🩺 Gemini / Imagen prompt — `logo.png` (optional, 512×512, transparent)

> Minimalist app icon: a stylized heartbeat/pulse line forming a subtle upward
> trend, inside a rounded square, teal-to-blue gradient on a dark background.
> Flat, modern, crypto-fintech. Transparent PNG, 512×512.

---

After adding files, just redeploy `web/` — no code changes needed.
