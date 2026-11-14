/**
 * ============================================================================
 * components/pitch-runner.js
 * ----------------------------------------------------------------------------
 * The strip along the bottom of every page: a cartoon player in the school
 * kit dribbles the ball from the left edge of the screen to a goal on the
 * right edge, scores, celebrates, and starts again.
 *
 * How it works
 *   - Drawing: inline SVG (doll, ball, goal). No images or libraries.
 *   - Motion: one requestAnimationFrame loop computes every position from the
 *     time since the cycle started (see `frame`). Phases:
 *       run  -> dribble across the screen (length depends on screen width)
 *       kick -> wind up and strike
 *       fly  -> ball curls into the net, net ripples, "GOAL!" pops
 *       party-> two jumps with arms up
 *       fade -> fades out, then the next run starts from the left
 *   - Browsers pause the loop in background tabs automatically.
 *   - Visitors who prefer reduced motion see the player standing by the goal.
 *   - The small "Hide" button removes it for the rest of the visit.
 * ============================================================================
 */
import { registerAction } from "../core/actions.js";

const HIDDEN_KEY = "vss-runner-hidden";

/* ---------------------------------------------------------------------------
   Timing (seconds) and speed (pixels per second)
   ------------------------------------------------------------------------ */
const KICK = 0.36;
const FLY = 0.5;
const PARTY = 1.9;
const FADE = 0.45;
const SPEED_DESKTOP = 230;
const SPEED_PHONE = 140;
const STRIDE_RATE = 13;        // leg-swing speed while running (radians per second)

/* ---------------------------------------------------------------------------
   Drawing
   The doll is drawn in a 56 x 96 box. Moving parts are groups whose pivot
   (hip or shoulder) is listed in PIVOTS; the loop rotates them around it.
   ------------------------------------------------------------------------ */
const PIVOTS = {
  armBack: [45, 79],
  legBack: [51.5, 103],
  legFront: [63.5, 103],
  armFront: [71, 79],
};

const DOLL_SVG = `
<svg class="runner__doll" viewBox="30 36 56 96" aria-hidden="true">
  <defs>
    <linearGradient id="pr-jersey" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F6CB63"/><stop offset="1" stop-color="#D99E26"/>
    </linearGradient>
    <radialGradient id="pr-skin" cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stop-color="#C98A5A"/><stop offset="1" stop-color="#9C6036"/>
    </radialGradient>
  </defs>
  <g data-part="body">
    <ellipse cx="58" cy="129.5" rx="15" ry="2.4" fill="#000" fill-opacity="0.18" data-part="shadow"/>
    <g data-part="armBack">
      <path d="M45 79 L39 95" stroke="url(#pr-skin)" stroke-width="5.5" stroke-linecap="round"/>
      <circle cx="38.6" cy="96.5" r="3" fill="#A86A3E"/>
    </g>
    <g data-part="legBack">
      <rect x="48" y="102" width="7" height="10" rx="3" fill="#A86A3E"/>
      <rect x="47.5" y="110" width="8" height="12" rx="2.5" fill="#E9B23F"/>
      <rect x="47.5" y="113" width="8" height="2.2" fill="#17160F"/>
      <path d="M45 121.5 H55 Q59.5 121.5 59.5 125.5 V127 H45 Z" fill="#17160F"/>
    </g>
    <g data-part="legFront">
      <rect x="60" y="102" width="7" height="10" rx="3" fill="#B87445"/>
      <rect x="59.5" y="110" width="8" height="12" rx="2.5" fill="#F2BE4E"/>
      <rect x="59.5" y="113" width="8" height="2.2" fill="#17160F"/>
      <path d="M58 121.5 H68 Q72.5 121.5 72.5 125.5 V127 H58 Z" fill="#17160F"/>
    </g>
    <path d="M44 93 H72 L74 106 H61 L58 101.5 L55 106 H42 Z" fill="#17160F"/>
    <path d="M44.5 95 L43 105 M71.5 95 L73 105" stroke="#E3B13B" stroke-width="1.6"/>
    <path d="M46 72 Q58 67.5 70 72 L77 83 L71.5 86.5 L69.5 82.5 L69.5 96 Q58 98.5 46.5 96 L46.5 82.5 L44.5 86.5 L39 83 Z" fill="url(#pr-jersey)"/>
    <path d="M52.5 71 L58 77.5 L63.5 71" fill="none" stroke="#17160F" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M52.5 83 L58 92 L63.5 83" fill="none" stroke="#17160F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <g data-part="armFront">
      <path d="M71 79 L77.5 94" stroke="url(#pr-skin)" stroke-width="5.5" stroke-linecap="round"/>
      <circle cx="78" cy="95.5" r="3" fill="#A86A3E"/>
    </g>
    <rect x="55" y="65" width="6" height="7" rx="2" fill="#93592F"/>
    <circle cx="44.6" cy="58" r="3.2" fill="#A86A3E"/>
    <circle cx="71.4" cy="58" r="3.2" fill="#A86A3E"/>
    <circle cx="58" cy="56" r="14" fill="url(#pr-skin)"/>
    <path d="M43.6 56 C42 40 74 38.5 72.4 55 C70.5 49.5 67 46.8 62.5 47.2 C63.5 50.2 60.5 51.2 58.8 48.4 C57 51.6 52 51.8 50.6 49.4 C48.6 51.4 45.6 53.2 43.6 56 Z" fill="#24160D"/>
    <path d="M50 53.2 Q52.6 51.8 55 53 M61 53 Q63.4 51.8 66 53.2" stroke="#24160D" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <ellipse cx="52.6" cy="58" rx="2.7" ry="3.2" fill="#FFF"/><ellipse cx="63.4" cy="58" rx="2.7" ry="3.2" fill="#FFF"/>
    <circle cx="53.6" cy="58.6" r="1.8" fill="#2B1B12"/><circle cx="64.4" cy="58.6" r="1.8" fill="#2B1B12"/>
    <circle cx="54.2" cy="57.8" r="0.6" fill="#FFF"/><circle cx="65" cy="57.8" r="0.6" fill="#FFF"/>
    <path d="M53.6 64.6 Q58 69.4 62.4 64.6 Z" fill="#6B2B18"/>
  </g>
</svg>`;

const BALL_SVG = `
<svg class="runner__ball" viewBox="0 0 20 20" aria-hidden="true">
  <circle cx="10" cy="10" r="9.2" fill="#FFF" stroke="#17160F" stroke-width="1.2"/>
  <path d="M10 5.6 L14.2 8.6 L12.6 13.4 L7.4 13.4 L5.8 8.6 Z" fill="#17160F"/>
  <path d="M10 5.6 V1.2 M14.2 8.6 L18.6 7.2 M12.6 13.4 L15.2 17.4 M7.4 13.4 L4.8 17.4 M5.8 8.6 L1.4 7.2" stroke="#17160F" stroke-width="1"/>
</svg>`;

const GOAL_SVG = `
<svg class="runner__goal" viewBox="0 0 74 64" aria-hidden="true">
  <defs>
    <pattern id="pr-net" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <path d="M0 0 V6 M0 0 H6" stroke="#8E9C92" stroke-width="1" fill="none"/>
    </pattern>
  </defs>
  <path class="runner__net" d="M5 6 L44 9 L66 62 L5 62 Z" fill="url(#pr-net)"/>
  <!-- posts: dark outline under white so they show on light backgrounds -->
  <path d="M5 62 V6 L44 9 L66 62" fill="none" stroke="#5F6B63" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 62 V6 L44 9 L66 62" fill="none" stroke="#FFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/* ---------------------------------------------------------------------------
   Maths helpers
   ------------------------------------------------------------------------ */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------------------------------------------------------------------
   Runner
   ------------------------------------------------------------------------ */
export function mountPitchRunner() {
  let hidden = false;
  try { hidden = sessionStorage.getItem(HIDDEN_KEY) === "1"; } catch { /* storage blocked */ }
  if (hidden) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="runner" id="pitch-runner">
      <div class="runner__grass" aria-hidden="true"></div>
      <div class="runner__goal-wrap">${GOAL_SVG}</div>
      <span class="runner__goal-text" aria-hidden="true">GOAL!</span>
      <div class="runner__player">${DOLL_SVG}</div>
      <div class="runner__ball-wrap">${BALL_SVG}</div>
      <button type="button" class="runner__hide" data-action="hide-runner" aria-label="Hide the football animation">Hide</button>
    </div>`);
  document.body.classList.add("has-runner");

  const root = document.getElementById("pitch-runner");
  const player = root.querySelector(".runner__player");
  const ball = root.querySelector(".runner__ball-wrap");
  const parts = Object.fromEntries([...root.querySelectorAll("[data-part]")].map((el) => [el.dataset.part, el]));

  /** Rotate a body part (degrees) around its pivot. */
  const turn = (name, degrees) => {
    const [cx, cy] = PIVOTS[name];
    parts[name].setAttribute("transform", `rotate(${degrees.toFixed(1)} ${cx} ${cy})`);
  };

  /* -- Layout, measured every frame so resizing just works ----------------- */
  function layout() {
    const width = root.clientWidth;
    const phone = width < 700;
    const playerWidth = player.offsetWidth;
    const goalLeft = width - root.querySelector(".runner__goal-wrap").offsetWidth - 10;
    return {
      phone,
      playerWidth,
      ballSize: ball.offsetWidth,
      goalLeft,
      start: -playerWidth - 20,
      kickAt: goalLeft - (phone ? 120 : 190),
      speed: phone ? SPEED_PHONE : SPEED_DESKTOP,
    };
  }

  /* -- Pose for time t in the current cycle -------------------------------- */
  let cycleStart = performance.now();

  function frame(now) {
    const L = layout();
    const runTime = Math.max(1.2, (L.kickAt - L.start) / L.speed);
    const tKick = runTime, tFly = tKick + KICK, tParty = tFly + FLY, tFade = tParty + PARTY, cycle = tFade + FADE;
    let t = (now - cycleStart) / 1000;
    if (t >= cycle) { cycleStart = now; t = 0; }

    let x, bodyLift = 0, legF = 0, legB = 0, armF = 0, armB = 0;
    let ballX, ballLift = 0, ballSpin;
    const footX = (px) => px + L.playerWidth * 0.62;

    if (t < tKick) {
      // RUN: dribble across, touching the ball forward every stride
      const s = t / runTime;
      x = lerp(L.start, L.kickAt, s);
      const stride = Math.sin(t * STRIDE_RATE);
      legF = -34 * stride; legB = 34 * stride;
      armF = 30 * stride; armB = -30 * stride;
      bodyLift = -Math.abs(Math.cos(t * STRIDE_RATE)) * 3;
      ballX = footX(x) + 8 + Math.abs(Math.sin(t * STRIDE_RATE * 0.5)) * 14;
      ballSpin = ballX * 2.2;
    } else if (t < tFly) {
      // KICK: wind up then strike
      x = L.kickAt;
      const k = (t - tKick) / KICK;
      legF = k < 0.55 ? lerp(0, 42, ease(k / 0.55)) : lerp(42, -78, ease((k - 0.55) / 0.45));
      legB = -6;
      armF = -55 * ease(k); armB = 55 * ease(k);
      ballX = footX(x) + 8;
      ballSpin = ballX * 2.2;
    } else {
      x = L.kickAt;
      // FLY: ball curls into the net, then drops inside the goal
      const f = clamp01((t - tFly) / FLY);
      const from = footX(x) + 8, to = L.goalLeft + 30;
      ballX = lerp(from, to, ease(f));
      ballLift = f < 1 ? Math.sin(f * Math.PI) * 46 + f * 10 : Math.max(0, 10 - (t - tParty) * 40);
      ballSpin = from * 2.2 + f * 720;
      legF = lerp(-78, 0, clamp01((t - tFly) / 0.35));

      // PARTY: two jumps, arms up in a V
      if (t >= tParty) {
        const p = t - tParty;
        armF = -125 * ease(clamp01(p / 0.25)); armB = 125 * ease(clamp01(p / 0.25));
        if (p < 1.4) bodyLift = -Math.abs(Math.sin((p / 0.7) * Math.PI)) * 16;
        legF = bodyLift < -2 ? -14 : 0; legB = bodyLift < -2 ? 14 : 0;
      }
    }

    // Apply
    const fade = t > tFade ? 1 - clamp01((t - tFade) / FADE) : Math.min(1, t / 0.25);
    root.style.setProperty("--runner-fade", fade.toFixed(2));
    player.style.transform = `translate(${x.toFixed(1)}px, ${bodyLift.toFixed(1)}px)`;
    ball.style.transform = `translate(${ballX.toFixed(1)}px, ${(-ballLift).toFixed(1)}px) rotate(${ballSpin.toFixed(0)}deg)`;
    turn("legFront", legF); turn("legBack", legB); turn("armFront", armF); turn("armBack", armB);
    root.classList.toggle("is-scored", t >= tParty - 0.05 && t < tFade);

    if (running) requestAnimationFrame(frame);
  }

  /* -- Start (or a still frame for reduced motion) -------------------------- */
  let running = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (running) {
    requestAnimationFrame(frame);
  } else {
    // Still frame: standing by the goal with arms up
    const L = layout();
    player.style.transform = `translate(${L.kickAt}px, 0)`;
    ball.style.transform = `translate(${L.goalLeft + 30}px, 0)`;
    turn("armFront", -125); turn("armBack", 125); turn("legFront", 0); turn("legBack", 0);
    root.style.setProperty("--runner-fade", "1");
  }

  registerAction("hide-runner", () => {
    running = false;
    root.remove();
    document.body.classList.remove("has-runner");
    try { sessionStorage.setItem(HIDDEN_KEY, "1"); } catch { /* storage blocked */ }
  });
}
