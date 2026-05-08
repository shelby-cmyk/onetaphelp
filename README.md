# OneTapHelp

Marketing site for OneTapHelp — a personal emergency response system (PERS) / medical alert service.

## Stack

Static HTML + CSS + vanilla JavaScript. No build step.

- 16 pages (index, plans, how-it-works, for-families, compare, contact, faq, resources, 3 guides, privacy, terms, cookies, consumer-health-data, welcome, 404)
- 5 JS modules: `cookies.js`, `tracking.js`, `banner.js`, `countdown.js`, `exit-intent.js`
- Schema.org JSON-LD on every page (Organization, Product on index/plans, FAQPage on faq)
- MHMDA / CCPA / TCPA compliance scaffolding

## Local development

```sh
python3 -m http.server 8765
# or any static server
```

Open http://localhost:8765

## Structure

```
.
├── index.html              Homepage (cinematic hero, only page with hero photo)
├── plans.html              Three pricing tiers
├── how-it-works.html       Process explanation
├── for-families.html       Adult-child caregiver page
├── compare.html            Vs. Life Alert / Medical Guardian / Bay Alarm
├── contact.html            TCPA-compliant contact form
├── faq.html                FAQ with FAQPage JSON-LD
├── resources.html          Index of guides
├── guide-*.html            3 long-form guides
├── quiz.html               4-question plan finder
├── welcome.html            Senior-direct landing page (noindex, for direct mail)
├── privacy.html            Privacy Policy (template — needs attorney review)
├── terms.html              Terms of Service (template — needs attorney review)
├── cookies.html            Cookie Policy disclosure
├── consumer-health-data.html  MHMDA / WA / CT / NV health data notice
├── 404.html                Not found
├── sitemap.xml
├── robots.txt
└── assets/
    ├── css/style.css       Design system + all components
    ├── js/                 5 JS modules
    └── img/                Photos + product shots + logos
```

## Brand system

- **Colors:** navy `#1B3A5C`, coral `#E8743C`, cream `#FBF8F3`, gold `#FFD89A`
- **Type:** system sans for body; Source Serif 4 italic (Google Fonts) for accent emphasis
- **Wordmark:** "OneTapHelp" with the "Help" portion always coral

## Pre-launch checklist

- [ ] Replace `1-800-TAP-HELP` placeholder with real number (60+ instances site-wide)
- [ ] Update `[Mailing Address]` placeholders in privacy, terms, contact, consumer-health-data
- [ ] Set effective dates on legal pages (`[DATE]` placeholders)
- [ ] Attorney review of privacy, terms, consumer-health-data templates
- [ ] Sign LiveFree dealer agreement
- [ ] Wire CallRail (or similar) for source-specific phone routing — see `assets/js/tracking.js` `PHONE_MAP`
- [ ] Wire ESP for exit-intent form submissions (currently logs to console)
- [ ] Register A2P 10DLC for SMS at scale
- [ ] Real customer reviews to replace Promise/Commitments placeholder cards

## Deployment

Designed for static hosting (Cloudflare Pages, Netlify, Vercel, GitHub Pages). No server required.

## License

Proprietary. All rights reserved.
