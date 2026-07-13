# Travian Elephant Finder

[![CI](https://github.com/tegos/travian-elephant-finder/actions/workflows/ci.yml/badge.svg)](https://github.com/tegos/travian-elephant-finder/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/tegos/travian-elephant-finder)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](package.json)

<img src="assets/demo.webp" alt="Travian Elephant Finder demo" width="800"><br/>

**Find the best oases to raid near your village, automatically.**

In Travian, oases are map tiles guarded by wild animals. Clear one and you get a resource bonus plus hero experience. **Elephants** are the toughest guards and give the most hero XP, so oases with elephants are the best targets on the map. Finding them by hand means opening hundreds of tiles one by one.

This tool does it for you. Tell it how far around your village to look, and it scans every tile in that area, records each oasis, then checks which ones hold elephants (and crocodiles, tigers, and other animals). You get a tidy report sorted by distance, closest first.

Tested in **Shadow Empires**, **Fire and Sand** and **Legends (4)**.

<p align="center">
<img src="assets/fire-and-sand.png" alt="Fire and Sand server logo" width="700"><br/>
<img src="assets/legends-logo-black.png" alt="Legends server logo" width="200">
<img src="assets/shadow-empires-logo.png" alt="Shadow Empires server logo" width="200">
</p>

## Table of contents

- [How the search works](#how-the-search-works)
- [Requirements](#requirements)
- [Quickstart](#quickstart)
- [Configuration](#configuration)
- [Usage](#usage)
- [Understanding the report](#understanding-the-report)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Technologies](#technologies)
- [Author](#author)
- [License](#license)
- [Disclaimer](#disclaimer)

## How the search works

You pick a **center** and a **distance**. The tool scans every map tile within that distance of the center - a circle around your village - and finds the oases inside it. That's the whole idea: one point, one number.

<img src="assets/distance-search.svg" alt="Search area: a circle of a given distance around your village" width="640">

- **Center** - by default, your **active village**. Leave `START_X` / `START_Y` empty in the config and the tool reads your village coordinates from the game automatically. Want to search around a different spot (an alliance hub, a future settling area)? Just type those coordinates in.
- **Distance** - how far to look, in map tiles. `DISTANCE=15` means "scan everything within 15 tiles of the center". Bigger distance = more tiles = longer scan.

Before each scan the tool tells you how many tiles it will check and roughly how long that takes, so there are no surprises:

```text
Scan center: (-24, -162) (auto-detected from active village) · distance: 7
Scanning 131 tiles (~2 min at current delay)
```

Village tiles are skipped automatically (a village can never be an oasis), so the scan only spends time on tiles that might actually be one.

<img src="assets/map.png" alt="Travian world map" width="700">

## Requirements

- Node.js >=22 (see `.nvmrc` - run `nvm use` if you have nvm)
- A Travian account (use a throwaway/fake one - see the [Disclaimer](#disclaimer))

## Quickstart

```bash
git clone https://github.com/tegos/travian-elephant-finder.git
cd travian-elephant-finder
npm install
npm run setup          # creates your .env config file
# open .env and fill in your server + login (see Configuration below)
npm run collect        # scan the area, record every oasis
npm run find           # check those oases for elephants, write the report
```

That's it. When `find` is done, open the generated HTML file in `output/` to see your targets.

## Configuration

`npm run setup` creates a `.env` file from the template. Open it and fill it in:

```dotenv
TRAVIAN_SERVER=https://ts5.x1.europe.travian.com
TRAVIAN_LOGIN=your-account-name
TRAVIAN_PASSWORD=your-password

# Center of the search. Leave both empty to use your active village automatically.
START_X=
START_Y=

# How far to search, in map tiles around the center.
DISTANCE=15

DELAY_MIN=100
DELAY_MAX=1500
```

| Setting | What it does |
|---|---|
| `TRAVIAN_SERVER` | Your game world's address, e.g. `https://ts5.x1.europe.travian.com` |
| `TRAVIAN_LOGIN` | Your account name (throwaway account recommended - see disclaimer) |
| `TRAVIAN_PASSWORD` | Your account password |
| `START_X`, `START_Y` | Center of the search. **Leave empty** to use your active village. Fill in only to search elsewhere. |
| `DISTANCE` | How far to search, in tiles. Default `15`. Start small, increase if you want a wider area. |
| `DELAY_MIN`, `DELAY_MAX` | Random pause between requests, in milliseconds. Keeps traffic looking human. |

The only settings you *must* fill in are the server and your login. Everything else has a sensible default.

> **Ban risk:** this tool logs into your Travian account through the game's own login API using the credentials in `.env`, then automates gameplay. That is against most servers' terms of service, and handing real credentials to a script is a direct violation. Use a throwaway account you're prepared to lose - never your main. The maintainer is not responsible for banned accounts.

> The tool manages its own login session (stored in `src/config/cookie.txt`) and refreshes it automatically. You never touch that file.

## Usage

**1. Scan the area** - `npm run collect` opens every tile within `DISTANCE` of your center and records which ones are oases.

<img src="assets/npm-collect.png" alt="npm run collect in progress" width="700">

**2. Find the elephants** - `npm run find` goes through the recorded oases, checks the animals guarding each, and writes the report.

**3. Read the report** - results land in `output/`:
- `elephant_*.html` - a sortable report, open it in your browser
- `elephant_*.csv` - the raw data, for spreadsheets

Need a fresh start? `npm run clean` empties the `output/` folder and resets the recorded oases. Run it before scanning a different area so old results don't mix in.

## Understanding the report

The HTML report lists every oasis that holds elephants. Each coordinate links straight to that tile on the in-game map, and you can click any column header to re-sort.

<img src="assets/result-oasis.png" alt="Sortable HTML report" width="700">

| Column | Meaning |
|---|---|
| `Oasis` | Oasis coordinates, linked to the tile on the in-game map |
| `Elephants` | How many elephants guard the oasis |
| `Guards` | The full guard list - every animal type and its count, with elephants highlighted |
| `Distance` | Distance from your scan center, in fields |

The `elephant_*.csv` alongside it holds the same data as plain columns (`x, y, distance, elephants, totalAnimals, guards`) for spreadsheets.

## Troubleshooting

- **Exits with "Missing required configuration"** - a required `.env` value is empty, usually `TRAVIAN_LOGIN` / `TRAVIAN_PASSWORD`. Re-check the [Configuration](#configuration) section.
- **Exits with "Login failed: ..."** - wrong credentials, or the account is locked/banned. Double-check your login and password.
- **"Could not auto-detect village coordinates"** - the tool couldn't read your village from the game. Fill in `START_X` and `START_Y` manually.
- **Scan is too slow** - lower `DISTANCE`, or raise `DELAY_MIN` / `DELAY_MAX` if you're being rate-limited. The tile count and time estimate printed at the start tell you what to expect.
- **Stalls or errors mid-run** - the session likely expired; the tool re-logs in automatically on the next request. If it keeps failing, just rerun - both scripts resume from where they left off (`output/oasis.json`).

## Development

- `npm test` - run the unit tests
- `npm run lint` - check code style with [Biome](https://biomejs.dev/)
- `npm run lint:fix` - auto-fix what Biome can

## Technologies

- **Node.js** >=22
- **Axios** - HTTP requests
- **Cheerio** - HTML parsing
- **cli-progress** - progress bar
- **dotenv** - environment config
- **Biome** - linting/formatting

## Author

* [**Mykhavko Ivan**](https://github.com/Tegos)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Disclaimer

_This is a research project - use it on your own behalf and at your own risk. The maintainer is not responsible for how it's used or for any consequences, including banned accounts._

---

<p align="center">
  <a href="https://savelife.in.ua/en/donate-en/" target="_blank">
    <img src="./assets/come-back-alive.svg" alt="Donate"/>
  </a>
</p>
