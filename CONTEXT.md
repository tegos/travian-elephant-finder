# Context

Glossary for Travian Elephant Finder. Terms only, no implementation.

## Glossary

### Oasis
A map tile guarded by wild animals; clearing it grants resource bonus + hero XP.
Oasis positions are **fixed at server start** and never move. A tile is either an
oasis for the whole server lifetime or never. Animals on it respawn/grow over time,
but the set of oasis tiles is immutable.

### Village
A player-founded tile. Villages are founded only on empty valley tiles, never on
oases. Therefore a tile that holds a village was never an oasis and never will be —
even if the village is later abandoned or destroyed, that tile stays a valley.
Consequence: **village tiles can be safely skipped when scanning for oases** — zero
risk of missing an oasis.

### Scan center
The origin of a search, `(startX, startY)`. Defaults to the player's **active
village** (the one `dorf1.php` opens), auto-detected from `.coordinateX` /
`.coordinateY` when `START_X` / `START_Y` are left empty. Can be overridden to any
coordinate. Doubles as the origin for distance-sorting results.

### Distance
Search radius in map tiles around the scan center. The scan covers every tile whose
Euclidean distance from the center is within `DISTANCE` - a circle, not a rectangle.
Replaces the old `MIN_X/MIN_Y/MAX_X/MAX_Y` bounding box.

### Occupied oasis
An oasis annexed to a nearby village. Still an oasis tile, but can't be cleared for
yourself. Detected live via the `oasis-3` CSS class on the tile popup and excluded
via `oasis-occupied.json`.

### map.sql
Public, unauthenticated per-server dump (`<server>/map.sql`). Lists **only occupied
villages** — no oasis data, no empty tiles (tribe ids 1/2/3/5 only). Live-verified
on `ts5.x1.europe.travian.com`. Useful here solely to skip village tiles during the
oasis grid scan.
