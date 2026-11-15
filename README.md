# V Soccer School: website

The official website of **V Soccer School, Bengaluru**: a football school for boys and girls aged 5 to 17, coached by former national-level player Ramesh B. (AFC 'B' Diploma, AIFF 'C' Licence). Parents can explore the programmes and the four grounds (Varthur, Sarjapura, Sarjapura Attibele Road, and the home ground at INSA Sports Academy), check live session times, and book a free trial. Every request is emailed to the school automatically.

Built with plain JavaScript (ES modules), HTML and CSS. No framework, no backend, no packages to install.

---

## Features

- **11 screens** with hash routing: Home, About, Programmes, Head Coach, Branches (plus one page per ground), Timetable, Gallery, Partners, Contact, Book a trial, My requests.
- **Live session status** in Bengaluru time: ground tabs, a "Who's training next" board and a weekly timetable, all refreshed every 15 seconds.
- **Book a free trial** form: the date of birth sets the age group and programme, and the batch and date lists show only real sessions.
- **Automatic email** of every trial request, edit, cancellation, contact message and newsletter sign-up, sent through FormSubmit.
- **My requests**: visitors can view, edit, cancel or resend what they sent from this device.
- **Football animations**: a cartoon player in the school kit dribbles across the bottom of every page and scores. After each request, the same player pops up giving a thumbs-up.
- **Media**: a top-down match-day video on the home page, a photo gallery with a full-screen viewer, and photo-backed sections.
- **Light and dark mode**, fully responsive from 320 px phones to large desktops.

---

## Run it

Requires [Node.js](https://nodejs.org) 16 or later. There's nothing to install.

**First time only:** create your private settings file from the template.

```bash
cp .env.example .env          # Windows: copy .env.example .env
```

Open `.env` and set `SCHOOL_EMAIL` (and optionally `SCHOOL_PHONE` and `SCHOOL_INSTAGRAM`).

```bash
npm start          # run the site at http://localhost:3000
npm run build      # create dist/index.html, a single standalone file
npm run preview    # build, then serve the built version
npm run env        # only regenerate src/js/config/env.js from .env
```

- Use another port with `PORT=5000 npm start` (in PowerShell: `$env:PORT=5000; npm start`).
- The terminal also prints a link for your phone on the same Wi-Fi.
- `index.html` at the project root needs `npm start` because it uses ES modules.
- `dist/index.html` opens on double-click. Upload it, or the whole folder, to any static host such as Netlify, Vercel, GitHub Pages or cPanel.

---

## Private settings (.env)

Personal details are kept out of the code and out of Git.

| File | In Git? | Purpose |
|---|---|---|
| `.env` | **No** (in `.gitignore`) | Your real values: `SCHOOL_EMAIL`, `SCHOOL_PHONE`, `SCHOOL_INSTAGRAM` |
| `.env.example` | Yes | Template showing which settings exist, with placeholder values |
| `src/js/config/env.js` | **No** (in `.gitignore`) | Generated from `.env` by `scripts/env.js`; the site imports it |

- `npm start` serves `env.js` straight from `.env` on every request, so after editing `.env` you only need to refresh the browser.
- `npm run build` writes `env.js` first, then bundles it into `dist/index.html`.
- If `SCHOOL_EMAIL` is empty, form emails switch off and visitors get the WhatsApp, email and copy buttons instead. The server prints a warning at start-up.

> **Note:** `.gitignore` keeps the address out of your repository, but a static site has to send to it from the browser, so it still appears in the published page's code. To hide it there too, use the FormSubmit alias (step 3 below).

## Hosting on GitHub Pages

`.env` and `dist/` are not in Git, so GitHub builds the site itself with `.github/workflows/deploy.yml`, taking the private settings from repository secrets.

1. In the repository go to **Settings → Secrets and variables → Actions → New repository secret** and add `SCHOOL_EMAIL` (optionally `SCHOOL_PHONE` and `SCHOOL_INSTAGRAM`).
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The **Actions** tab shows the build; the site goes live at `https://<owner>.github.io/<repo>/`.

Every later push to `main` redeploys automatically. To redeploy after changing a secret, open **Actions → Deploy to GitHub Pages → Run workflow**.

## Email setup (one time)

Form submissions are emailed to `SCHOOL_EMAIL` from `.env` through [FormSubmit](https://formsubmit.co), which is free and needs no account.

1. Run the site and submit any form once.
2. Open the activation email FormSubmit sends to that inbox (check spam) and click **Activate Form**.
3. Optionally, replace `SCHOOL_EMAIL` in `.env` with the random alias FormSubmit emails you, so the real address isn't visible in the published page.

Emails only send from a page served over http(s), meaning `npm start` or your hosting. They won't send from a double-clicked file. Each new domain needs activating once.

---

## Editing content

All content lives in **`src/js/config/site.config.js`**.

| To change | Edit |
|---|---|
| Inbox for form submissions, phone, Instagram | **`.env`** (not this file) |
| Public email shown on the Contact page | `BRAND.email` |
| Batch days and times (current values are samples) | `GROUNDS[].sessions` |
| Home page video | `HERO_VIDEO.src` (for example `assets/match-day.mp4`) |
| Photos | `PHOTOS` (put your own files in `assets/`) |
| Programmes, coach, partners, FAQ | the matching section |
| Colours and fonts (Bebas Neue + Poppins) | `src/styles/tokens.css` |
| Add a screen | create `src/js/pages/<name>.page.js` and add it to `src/js/pages/routes.js` |

---

## Project structure

```
v-soccer-school/
├── .env                       Private settings (git-ignored; create from .env.example)
├── .env.example               Template for .env
├── .gitignore                 Keeps .env, generated env.js and dist/ out of Git
├── .github/workflows/deploy.yml  Builds and publishes the site to GitHub Pages
├── index.html                 Page shell: header, navigation, ground tabs, footer
├── server.js                  Local server (Node built-ins only); serves env.js from .env
├── package.json               npm scripts: start, build, preview, env
├── scripts/
│   ├── build.js               Bundles everything into dist/index.html
│   └── env.js                 Reads .env and generates src/js/config/env.js
├── assets/                    Logo (logo.webp for the site, logo.png for print/social)
├── dist/index.html            Built single-file site (generated)
└── src/
    ├── styles/
    │   ├── tokens.css         Colours, fonts, sizes; light and dark themes
    │   ├── base.css           Reset, typography, container, buttons
    │   ├── layout.css         Header, navigation, ground tabs, footer
    │   ├── components.css     Photos, banners, cards, forms, FAQ, lightbox
    │   ├── pages.css          Styles used by one screen only
    │   ├── pitch-runner.css   Football strip along the bottom of every page
    │   └── celebration.css    Thumbs-up player shown after a request
    └── js/
        ├── app.js             Entry point: theme, menu, routing, live refresh
        ├── config/
        │   ├── site.config.js All site content and settings
        │   └── env.js         Generated from .env (git-ignored, do not edit)
        ├── core/
        │   ├── actions.js     Click handling for data-action="..." buttons
        │   ├── dom.js         Escaping, toast, clipboard, form hints
        │   ├── mailer.js      Sends form data to the school's inbox
        │   ├── router.js      Hash routing (#home, #ground-varthur, ...)
        │   ├── store.js       Requests saved in the visitor's browser
        │   ├── time.js        Bengaluru clock, live session status, dates
        │   └── validators.js  Phone, email and age-group checks
        ├── components/
        │   ├── cards.js           Programme, coach, ground, partner and gallery blocks
        │   ├── ground-tabs.js     Live ground tabs under the navigation
        │   ├── timetable.js       Weekly timetable (grid on desktop, list on phones)
        │   ├── media.js           Photos, banners, photo strip, hero video
        │   ├── lightbox.js        Full-screen photo viewer
        │   ├── pitch-runner.js    Player dribbles across the screen and scores
        │   ├── goal-celebration.js  Shows the thumbs-up player for 5 s after a request
        │   └── thumbs-up-scene.js   The thumbs-up player drawing
        ├── forms/
        │   ├── trial-form.js      Book a free trial
        │   ├── contact-form.js    Contact form
        │   ├── newsletter.js      Footer sign-up
        │   ├── delivery.js        Emails a saved request and shows the result
        │   ├── share.js           WhatsApp, email and copy fallback
        │   └── summaries.js       Turns a request into email and text fields
        └── pages/
            ├── routes.js          Maps each address to a page; sets the nav order
            └── *.page.js          One file per screen
```

**How it fits together**
- **Routing:** `core/router.js` reads the address after `#`, `pages/routes.js` picks the page, and `app.js` draws it and runs the page's `mount()`.
- **Buttons:** an element with `data-action="name"` runs the handler registered with `registerAction("name", …)`. Search for the name to find its code.
- **Requests:** saved in the visitor's browser (`core/store.js`), emailed by `forms/delivery.js`. If email fails, the visitor gets WhatsApp, email and copy buttons instead.

---

## Credits

- Photos: free licence from [Pexels](https://www.pexels.com), credited in the site footer.
- Home video: "Aerial Video of a Football Match" by Vitaliy Haiduk on Pexels.
- Fonts: Bebas Neue and Poppins from Google Fonts.
