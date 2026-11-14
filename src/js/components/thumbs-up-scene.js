/**
 * ============================================================================
 * components/thumbs-up-scene.js
 * ----------------------------------------------------------------------------
 * Drawing for the pop-up shown after a request is sent: just the player cut
 * out (no background), posing with one boot on the ball, a hand on his hip,
 * a wink and a thumbs-up. Motion is CSS (styles/celebration.css):
 *   pops up -> thumb wiggles -> ball rocks gently -> fades after 5 s
 *
 * Drawn in the same coordinates as the runner doll (pitch-runner.js).
 * ============================================================================
 */

export const THUMBS_UP_SVG = `
<svg class="thumbs" viewBox="34 37 56 94" aria-hidden="true">
  <defs>
    <linearGradient id="tu-jersey" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F6CB63"/><stop offset="1" stop-color="#D99E26"/>
    </linearGradient>
    <radialGradient id="tu-skin" cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stop-color="#C98A5A"/><stop offset="1" stop-color="#9C6036"/>
    </radialGradient>
    <radialGradient id="tu-ball" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D7D7D7"/>
    </radialGradient>
  </defs>

  <!-- Player only (same body as the runner): no background, no shadow -->
  <g class="thumbs__doll">

    <!-- Ball under the raised boot -->
    <g class="thumbs__ball">
      <circle cx="76" cy="121.5" r="6.5" fill="url(#tu-ball)" stroke="#2A2822" stroke-width="0.8"/>
      <path d="M76 118.6 L78.7 120.5 L77.7 123.6 L74.3 123.6 L73.3 120.5 Z" fill="#17160F"/>
    </g>

    <!-- Back arm: hand on hip -->
    <path d="M45 79 L37.5 88 L45.5 96" fill="none" stroke="url(#tu-skin)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Standing leg -->
    <rect x="48" y="102" width="7" height="10" rx="3" fill="#A86A3E"/>
    <rect x="47.5" y="110" width="8" height="12" rx="2.5" fill="#E9B23F"/>
    <rect x="47.5" y="113" width="8" height="2.2" fill="#17160F"/>
    <path d="M45 121.5 H55 Q59.5 121.5 59.5 125.5 V127 H45 Z" fill="#17160F"/>

    <!-- Raised leg resting on the ball -->
    <g transform="rotate(-24 63.5 103) translate(0 -5)">
      <rect x="60" y="102" width="7" height="10" rx="3" fill="#B87445"/>
      <rect x="59.5" y="110" width="8" height="12" rx="2.5" fill="#F2BE4E"/>
      <rect x="59.5" y="113" width="8" height="2.2" fill="#17160F"/>
      <path d="M58 121.5 H68 Q72.5 121.5 72.5 125.5 V127 H58 Z" fill="#17160F"/>
    </g>

    <!-- Shorts and jersey -->
    <path d="M44 93 H72 L74 106 H61 L58 101.5 L55 106 H42 Z" fill="#17160F"/>
    <path d="M44.5 95 L43 105 M71.5 95 L73 105" stroke="#E3B13B" stroke-width="1.6"/>
    <path d="M46 72 Q58 67.5 70 72 L77 83 L71.5 86.5 L69.5 82.5 L69.5 96 Q58 98.5 46.5 96 L46.5 82.5 L44.5 86.5 L39 83 Z" fill="url(#tu-jersey)"/>
    <path d="M52.5 71 L58 77.5 L63.5 71" fill="none" stroke="#17160F" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M52.5 83 L58 92 L63.5 83" fill="none" stroke="#17160F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Front arm: thumbs-up (forearm + fist wiggle around the elbow) -->
    <path d="M71 79 L81 84" stroke="url(#tu-skin)" stroke-width="5.5" stroke-linecap="round"/>
    <g class="thumbs__thumb">
      <path d="M81 84 L83 70" stroke="url(#tu-skin)" stroke-width="5.5" stroke-linecap="round"/>
      <rect x="79" y="62.5" width="8.5" height="8" rx="3" fill="#A86A3E"/>
      <rect x="80.2" y="55.5" width="3.6" height="9" rx="1.8" fill="#A86A3E"/>
      <path d="M80 66 H87 M80 68.5 H87" stroke="#7E4A27" stroke-width="0.7"/>
    </g>

    <!-- Head: tilted, winking, big smile -->
    <g transform="rotate(-6 58 60)">
      <rect x="55" y="65" width="6" height="7" rx="2" fill="#93592F"/>
      <circle cx="44.6" cy="58" r="3.2" fill="#A86A3E"/>
      <circle cx="71.4" cy="58" r="3.2" fill="#A86A3E"/>
      <circle cx="58" cy="56" r="14" fill="url(#tu-skin)"/>
      <path d="M43.6 56 C42 40 74 38.5 72.4 55 C70.5 49.5 67 46.8 62.5 47.2 C63.5 50.2 60.5 51.2 58.8 48.4 C57 51.6 52 51.8 50.6 49.4 C48.6 51.4 45.6 53.2 43.6 56 Z" fill="#24160D"/>
      <path d="M50 52.4 Q52.6 51 55 52.2 M61 53 Q63.4 51.8 66 53.2" stroke="#24160D" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <!-- winking eye -->
      <path d="M50 58.6 Q52.6 56.4 55.2 58.6" stroke="#2B1B12" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- open eye -->
      <ellipse cx="63.4" cy="58" rx="2.7" ry="3.2" fill="#FFF"/>
      <circle cx="64.2" cy="58.6" r="1.8" fill="#2B1B12"/>
      <circle cx="64.8" cy="57.8" r="0.6" fill="#FFF"/>
      <path d="M52.6 64 Q58 71 63.4 64 Z" fill="#6B2B18"/>
      <path d="M54.2 65 Q58 66.8 61.8 65" stroke="#FFF" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;
