// ─────────────────────────────────────────────────────────────
//  projects.js  —  Edit this file to update your portfolio.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  HOW TO ADD A PROJECT:
//
//  title       — display name on the card
//  description — shown in the hover bubble
//  image       — screenshot: save file in /images/ and put "images/filename.png"
//                leave "" for an auto-generated placeholder
//  link        — where the card clicks to (live demo URL, or GitHub repo if no demo)
//  github      — optional: repo URL — shows a "view source" link in the bubble
//  tags        — short tech labels shown as chips in the bubble
// ─────────────────────────────────────────────────────────────

var projects = [
    {
        title: "The Oracle's Forecast",
        description: "A sorcerous divination tool that communes with weather spirits to foretell the coming storms. No sacrificial offerings required — just an API key.",
        image: "",
        link: "#",
        github: "",
        tags: ["JavaScript", "API", "CSS"]
    },
    {
        title: "The Quest Log",
        description: "A mystical scroll that remembers every task the adventurer commits to — and more importantly, which ones they quietly abandoned after 20 minutes.",
        image: "",
        link: "#",
        github: "",
        tags: ["React", "localStorage"]
    },
    {
        title: "The Arithmancer's Tool",
        description: "An arcane device for those who lack the mental fortitude to multiply numbers in their head. Peer reviewed by three wizards and a goblin accountant.",
        image: "",
        link: "#",
        github: "",
        tags: ["HTML", "CSS", "JS"]
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
//  Steam "recently played" — optional, static site friendly
//
//  HOW TO SET UP:
//  1. Get a free key at https://steamcommunity.com/dev/apikey
//     (any domain name works — use your GitHub Pages URL)
//  2. Find your 64-bit Steam ID at https://steamid.io
//  3. Fill in your details below
// ─────────────────────────────────────────────────────────────

var steamConfig = {
    apiKey:     "2FEDB1166B6D38009BD40461A2DFC0F8",
    steamId:    "76561198823151635",
    profileUrl: "https://steamcommunity.com/profiles/76561198823151635",
};
