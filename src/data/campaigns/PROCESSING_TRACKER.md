# Critical Role Campaign 4 — Transcript Processing Tracker

## Overview

- **Campaign**: Critical Role Campaign 4
- **World**: Aramán
- **DM**: Brennan Lee Mulligan
- **System**: D&D 2024 (5.5e)
- **Total Episodes**: 14
- **Playlist**: https://www.youtube.com/playlist?list=PL1tiwbzkOjQxygnACZdKLhzTTB3CoM8gi

## Processing Pipeline

1. **Extract** — Raw transcript via Apify YouTube Transcript actor
2. **Structure** — Claude Sonnet chunks transcript into enriched JSON segments
3. **Normalize** — Speaker names standardized across all episodes
4. **Store** — Saved as `campaign4-episode{N}.json` in this directory

## Episode Processing Status

| # | Title | Duration | Status | Segments | Raw Chars | Chunks | Process Time | Date Completed |
|---|-------|----------|--------|----------|-----------|--------|-------------|----------------|
| 1 | The Fall of Thjazi Fang | 4:27:48 | DONE | 764 | 198,049 | 17 | 48 min | 2026-02-19 |
| 2 | Broken Wing | 4:33:19 | DONE | 699 | 205,801 | 18 | 47.6 min | 2026-02-19 |
| 3 | The Snipping of Shears | 5:00:54 | DONE | 961 | 228,168 | 20 | 55.8 min | 2026-02-19 |
| 4 | Stone-Faced | 5:11:37 | DONE | 1004 | 228,115 | 20 | 58.6 min | 2026-02-19 |
| 5 | Branching Paths | 3:44:16 | DONE | 812 | 176,097 | 15 | 43.9 min | 2026-02-19 |
| 6 | Knives and Thorns | 4:39:19 | DONE | 1029 | 233,177 | 20 | 52.9 min | 2026-02-19 |
| 7 | On the Scent | 4:05:59 | DONE | 848 | 216,087 | 19 | 51.9 min | 2026-02-19 |
| 8 | Fanged Revenge | 4:29:30 | DONE | 1037 | 237,292 | 20 | 52.6 min | 2026-02-19 |
| 9 | To the Hounds! | 4:15:14 | DONE | 858 | 226,163 | 19 | 55.0 min | 2026-02-19 |
| 10 | Blood for Blood | 3:32:21 | DONE | 857 | 188,011 | 16 | 44.2 min | 2026-02-20 |
| 11 | Make Merry | 3:40:25 | DONE | 745 | 172,600 | 15 | ~44 min | 2026-02-20 |
| 12 | The Giant's Belt | 3:36:30 | DONE | 686 | 168,768 | 15 | ~41 min | 2026-02-20 |
| 13 | Seeking Sanctuary | 3:38:10 | DONE | 619 | 156,795 | 14 | ~42 min | 2026-02-20 |
| 14 | A Bridge Too Far | 3:42:16 | DONE | 523 | 184,772 | 16 | 31.9 min | 2026-02-20 |

## Batch Processing Plan

### Batch 0 — Apify Extraction (All 14 episodes)
- [x] Extract all raw transcripts from YouTube via Apify
- [x] Store as `/tmp/campaign4-raw-ep{N}.json`

### Batch 1 — Episodes 2-5
- [x] Episode 2: Broken Wing (699 segs, 47.6 min)
- [x] Episode 3: The Snipping of Shears (961 segs, 55.8 min)
- [x] Episode 4: Stone-Faced (1004 segs, 58.6 min)
- [x] Episode 5: Branching Paths (812 segs, 43.9 min)

### Batch 2 — Episodes 6-9
- [x] Episode 6: Knives and Thorns (1029 segs, 52.9 min)
- [x] Episode 7: On the Scent (848 segs, 51.9 min)
- [x] Episode 8: Fanged Revenge (1037 segs, 52.6 min)
- [x] Episode 9: To the Hounds! (858 segs, 55.0 min)

### Batch 3 — Episodes 10-14
- [x] Episode 10: Blood for Blood (857 segs, 44.2 min)
- [x] Episode 11: Make Merry (745 segs)
- [x] Episode 12: The Giant's Belt (686 segs)
- [x] Episode 13: Seeking Sanctuary (619 segs)
- [x] Episode 14: A Bridge Too Far (523 segs, 31.9 min)

## Frontend Integration Checklist

- [x] Episode selector on home page (start campaign from any episode)
- [ ] Lazy-load episode JSON files (not bundled at build time)
- [ ] Update CampaignLore panel to switch between episodes
- [ ] Campaign lore AI searches across all loaded episodes
- [x] Episode-specific scene descriptions and starting scenarios
- [x] Master campaign index file (`campaign4-index.json`)

## Cost Tracking

| Item | Episode 1 | Projected Total |
|------|-----------|----------------|
| Claude API calls | ~51 | ~669 |
| Claude API cost | ~$1.60 | ~$21 |
| Apify calls | 1 | 14 |
| Processing time | 48 min | ~10.6 hrs |
| JSON storage | 297 KB | ~3.9 MB |

## Cast (13 Players + DM)

| Player | Character | Race | Class |
|--------|-----------|------|-------|
| Brennan Lee Mulligan | DM | — | — |
| Laura Bailey | Thimble | Halfling | Rogue |
| Luis Carazo | Azune Nayar | Human | Paladin |
| Robbie Daymond | Kattigan Vale | Human | Warlock |
| Aabria Iyengar | Thaisha Lloy | Orc | Druid |
| Taliesin Jaffe | Bolaire Lathalia | Elf | Cleric |
| Ashley Johnson | Vaelus | Elf | Ranger |
| Matthew Mercer | Sir Julien Davinos | Human | Fighter |
| Whitney Moore | Tyranny | Tiefling | Sorcerer |
| Liam O'Brien | Halandil Fang | Orc | Bard |
| Marisha Ray | Murray Mag'Nesson | Dwarf | Barbarian |
| Sam Riegel | Wicander Halovar | Gnome | Wizard |
| Alexander Ward | Occtis Tachonis | Human | Wizard (Necromancy) |
| Travis Willingham | Teor Pridesire | Human | Fighter |

## Speaker Normalization Map

Standard format: `Character Name (Player Name)` — e.g., `Halandil Fang (Liam O'Brien)`

Special speakers: `DM (Brennan)`, `NPC (DM)`, `Multiple`

## Notes

- Episode 1 had 1 fallback chunk (chunk 7) where Claude failed to return valid JSON after 3 retries
- All episodes use 12K character chunks to stay within Claude's reliable output window
- Retry logic: 2 retries per chunk, with truncated JSON recovery as final fallback
- Speaker normalization runs as a post-processing step after each episode
