# V Soccer School: website

The official website of **V Soccer School, Bengaluru**: a football school for boys and girls aged 5 to 17, coached by former national-level player Ramesh B. (AFC 'B' Diploma, AIFF 'C' Licence). Parents can explore the programmes and the four grounds (Varthur, Sarjapura, Sarjapura Attibele Road, and the home ground at INSA Sports Academy), check live session times, and book a free trial. Every request is emailed and WhatsApped to the school automatically.

Built with plain JavaScript (ES modules), HTML and CSS. No framework, no backend, no packages to install.

---

## Features

- **11 screens** with hash routing: Home, About, Programmes, Head Coach, Branches (plus one page per ground), Timetable, Gallery, Partners, Contact, Book a trial, My requests.
- **Live session status** in Bengaluru time: ground tabs, a "Who's training next" board and a weekly timetable, all refreshed every 15 seconds.
- **Book a free trial** form: the date of birth sets the age group and programme, and the batch and date lists show only real sessions.
- **Automatic email and WhatsApp** of every trial request, edit, cancellation, contact message and newsletter sign-up, sent through FormSubmit (email) and a private Google Apps Script relay (WhatsApp).
- **WhatsApp first on the Contact page**: a green **Chat on WhatsApp** button in the banner, and the contact form's **Send on WhatsApp** button opens a chat with the school (`SCHOOL_WHATSAPP_CHAT`) with the parent's details already typed in. A copy is also emailed. Without a WhatsApp number, the form just emails.
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

Open `.env` and set `SCHOOL_EMAIL` (and optionally `SCHOOL_WHATSAPP_RELAY` and `SCHOOL_INSTAGRAM`).

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
| `.env` | **No** (in `.gitignore`) | Your real values: `SCHOOL_EMAIL`, `SCHOOL_WHATSAPP_RELAY`, `SCHOOL_WHATSAPP_CHAT`, `SCHOOL_INSTAGRAM` |
| `.env.example` | Yes | Template showing which settings exist, with placeholder values |
| `src/js/config/env.js` | **No** (in `.gitignore`) | Generated from `.env` by `scripts/env.js`; the site imports it |

- `npm start` serves `env.js` straight from `.env` on every request, so after editing `.env` you only need to refresh the browser.
- `npm run build` writes `env.js` first, then bundles it into `dist/index.html`.
- If both `SCHOOL_EMAIL` and `SCHOOL_WHATSAPP_RELAY` are empty, automatic sending switches off and visitors get email and copy buttons instead. The server prints a warning at start-up.

> **Visibility:** the email is shown on the Contact page on purpose. The phone number isn't printed on the site or stored in Git. The "Chat on WhatsApp" button's link does contain `SCHOOL_WHATSAPP_CHAT`, so anyone who taps it sees that number in WhatsApp.

## Hosting on GitHub Pages

`.env` and `dist/` are not in Git, so GitHub builds the site itself with `.github/workflows/deploy.yml`, taking the private settings from repository secrets.

1. In the repository go to **Settings → Secrets and variables → Actions → New repository secret** and add `SCHOOL_EMAIL`, `SCHOOL_WHATSAPP_CHAT` and `SCHOOL_WHATSAPP_RELAY` (optionally `SCHOOL_INSTAGRAM`).
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The **Actions** tab shows the build; the site goes live at `https://<owner>.github.io/<repo>/`.

Every later push to `main` redeploys automatically. To redeploy after changing a secret, open **Actions → Deploy to GitHub Pages → Run workflow**.

## Email setup (one time)

Form submissions are emailed to `SCHOOL_EMAIL` from `.env` through [FormSubmit](https://formsubmit.co), which is free and needs no account.

1. Run the site and submit any form once.
2. Open the activation email FormSubmit sends to that inbox (check spam) and click **Activate Form**.

Emails only send from a page served over http(s), meaning `npm start` or your hosting. They won't send from a double-clicked file. Each new domain needs activating once.

## WhatsApp setup (one time)

Every request is also WhatsApped to the school. The phone number stays private: the site posts each message to a Google Apps Script (`apps-script/whatsapp-relay.gs`) that holds the number and forwards the message through [CallMeBot](https://www.callmebot.com), a free service.

**A. Get a CallMeBot key** (on the phone that should receive requests)
1. Save the CallMeBot WhatsApp number shown on callmebot.com as a contact.
2. Send it this exact message on WhatsApp: `I allow callmebot to send me messages`
3. It replies with an API key.

**B. Create the relay** (signed in to any long-lived Google account)
1. Open [script.google.com](https://script.google.com), click **New project**, and paste `apps-script/whatsapp-relay.gs` into `Code.gs`.
2. **Project Settings → Script Properties → Add**: `SCHOOL_PHONE` (e.g. `+919845012345`, the same phone as step A) and `CALLMEBOT_APIKEY`.
3. Back in the editor, choose `testRelay` and click **Run**. Allow access when asked; a test message should arrive on WhatsApp.
4. **Deploy → New deployment → Web app**, Execute as **Me**, Who has access **Anyone**. Copy the **Web app URL**.

**C. Connect the site**
- Put the URL in `.env` as `SCHOOL_WHATSAPP_RELAY`, and add a GitHub secret with the same name.

Email and WhatsApp are sent together. A request counts as sent if either one works. The relay accepts at most 40 messages an hour, to limit spam. After editing the script, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

---

## Editing content

All content lives in **`src/js/config/site.config.js`**.

| To change | Edit |
|---|---|
| Inbox for form submissions (also shown on Contact), WhatsApp relay URL, WhatsApp chat number, Instagram | **`.env`** (not this file) |
| School phone number and CallMeBot key | Script Properties of the Google Apps Script |
| Batch days and times (current values are samples) | `GROUNDS[].sessions` |
| Home page video | `HERO_VIDEO.src` (desktop) and `HERO_VIDEO.mobileSrc` (smaller file for phones) |
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
├── apps-script/whatsapp-relay.gs Google Apps Script that WhatsApps each request (holds the phone privately)
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
        │   ├── whatsapp.js    Sends form data to the WhatsApp relay
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

- Photos: free licence from [Pexels](https://www.pexels.com) (no attribution required; photographers are listed in `PHOTOS` in site.config.js).
- Home video: "Aerial Video of a Football Match" by Vitaliy Haiduk on Pexels.
- Fonts: Bebas Neue and Poppins from Google Fonts.
