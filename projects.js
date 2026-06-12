// ─────────────────────────────────────────────────────────────
//  projects.js  —  Edit this file to update your portfolio.
//
//  ⚠ This file is public (GitHub Pages). Never put API keys or
//    secrets in here — anything in this repo is world-readable.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  HOW TO ADD A PROJECT:
//
//  title       — display name on the card (flavor name is fine)
//  subtitle    — plain-English one-liner: what it actually is
//  description — shown in the hover bubble
//  image       — screenshot: save file in /images/ and put "images/filename.png"
//                leave "" for an auto-generated placeholder
//  link        — where the card clicks to (live demo URL, or GitHub repo if no demo)
//  github      — optional: repo URL — shows a "view source" link in the bubble
//  tags        — short tech labels shown as chips in the bubble
// ─────────────────────────────────────────────────────────────

var projects = [
    {
        title: "The Serpent's Trial",
        subtitle: "browser snake game",
        description: "The arcade classic, summoned in the browser — with a Game Boy coat of paint. Steer the serpent, devour, grow, and learn that your greatest enemy was your own tail all along.",
        image: "",
        link: "https://damiensoobz.github.io/snakeysnake/",
        github: "https://github.com/Damiensoobz/snakeysnake",
        tags: ["JavaScript", "HTML", "CSS"]
    },
    {
        title: "Memento Mori",
        subtitle: "life-in-weeks calendar",
        description: "80 years. 52 weeks each. 4,160 boxes total. Enter your date of birth and watch the ones behind you fill in. Part calendar, part existential alarm clock.",
        image: "",
        link: "https://damiensoobz.github.io/Memento-Mori/",
        github: "https://github.com/Damiensoobz/Memento-Mori",
        tags: ["JavaScript", "CSS"]
    },
    {
        title: "The Cartographer's Conjuring",
        subtitle: "fantasy map generator — WIP",
        description: "Conjures procedurally generated fantasy realms: coastlines, mountain ranges, and place names no one can pronounce. Still brewing in the cauldron.",
        image: "",
        link: "#",   // TODO: repo URL until a hosted demo exists
        github: "",  // TODO: repo URL
        tags: ["Python", "Procedural Gen"]
    }
];

// ─────────────────────────────────────────────────────────────
//  Spotify "now playing" — optional, static site friendly
//
//  HOW TO SET UP:
//  1. Create a free Last.fm account at https://www.last.fm
//  2. In Spotify → Settings → Social, connect Last.fm scrobbling
//  3. Get a free API key at https://www.last.fm/api/account/create
//  4. Fill in your details below
//  (Last.fm read keys are rate-limited + read-only public data,
//   so exposing this one client-side is acceptable.)
// ─────────────────────────────────────────────────────────────

var spotifyConfig = {
    profileUrl:  "https://open.spotify.com/user/wp3u6rngsgjr9ufv0cffw6nkp?si=543a1709d1244910",
    lastfmUser:  "damiensoobz",
    lastfmKey:   "6ae90e4ac257aaa4a0d73230afa39dd8",
};

// ─────────────────────────────────────────────────────────────
//  GitHub "last push" — no API key needed, public data only
// ─────────────────────────────────────────────────────────────

var githubConfig = {
    username:   "Damiensoobz",
    profileUrl: "https://github.com/Damiensoobz",
};

// ─────────────────────────────────────────────────────────────
//  Steam "recently played"
//
//  ⚠ Steam Web API keys must NOT be put here — they grant access
//    to your whole key quota and live forever in git history.
//    The old key was exposed and must be revoked at:
//    https://steamcommunity.com/dev/apikey
//
//  PLAN: route through a serverless proxy (e.g. Vercel function)
//  that holds the key as an env var, then set proxyUrl below.
//  Until then the widget shows a plain profile link.
// ─────────────────────────────────────────────────────────────

var steamConfig = {
    proxyUrl:   "",   // e.g. "https://your-app.vercel.app/api/steam" — keeps the key server-side
    steamId:    "76561198823151635",
    profileUrl: "https://steamcommunity.com/profiles/76561198823151635",
};
