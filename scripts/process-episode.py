#!/usr/bin/env python3
"""
Process a single Critical Role Campaign 4 episode transcript.

Usage:
    python3 scripts/process-episode.py <episode_number>
    python3 scripts/process-episode.py 2
    python3 scripts/process-episode.py 2 3 4 5   # batch multiple

Reads from: /tmp/campaign4-raw-ep{N}.json
Writes to:  src/data/campaigns/campaign4-episode{N}.json
Updates:    src/data/campaigns/PROCESSING_TRACKER.md
"""

import json, urllib.request, re, time, sys, os
from datetime import datetime

ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

EPISODE_TITLES = {
    1: "The Fall of Thjazi Fang", 2: "Broken Wing", 3: "The Snipping of Shears",
    4: "Stone-Faced", 5: "Branching Paths", 6: "Knives and Thorns",
    7: "On the Scent", 8: "Fanged Revenge", 9: "To the Hounds!",
    10: "Blood for Blood", 11: "Make Merry", 12: "The Giant's Belt",
    13: "Seeking Sanctuary", 14: "A Bridge Too Far",
}

EPISODE_URLS = {
    1: "https://www.youtube.com/watch?v=3Mbynm0pGX0",
    2: "https://www.youtube.com/watch?v=mBQMuDAe4rE",
    3: "https://www.youtube.com/watch?v=-9sEmHv26js",
    4: "https://www.youtube.com/watch?v=jfUPvccklhY",
    5: "https://www.youtube.com/watch?v=w8ddrhcaqLk",
    6: "https://www.youtube.com/watch?v=WP8XS5SG04Y",
    7: "https://www.youtube.com/watch?v=qxUDUV2iQvI",
    8: "https://www.youtube.com/watch?v=UBgjcSc9QOw",
    9: "https://www.youtube.com/watch?v=NR4rk3oma8A",
    10: "https://www.youtube.com/watch?v=ohxUh7n7kJw",
    11: "https://www.youtube.com/watch?v=Ta2rfRcooZE",
    12: "https://www.youtube.com/watch?v=WRtb_XzfNTA",
    13: "https://www.youtube.com/watch?v=RWh4BFyW15M",
    14: "https://www.youtube.com/watch?v=TRDzQIenIPQ",
}

CAST = [
    {"player": "Laura Bailey", "character": "Thimble", "race": "Halfling", "class": "Rogue"},
    {"player": "Luis Carazo", "character": "Azune Nayar", "race": "Human", "class": "Paladin"},
    {"player": "Robbie Daymond", "character": "Kattigan Vale", "race": "Human", "class": "Warlock"},
    {"player": "Aabria Iyengar", "character": "Thaisha Lloy", "race": "Orc", "class": "Druid"},
    {"player": "Taliesin Jaffe", "character": "Bolaire Lathalia", "race": "Elf", "class": "Cleric"},
    {"player": "Ashley Johnson", "character": "Vaelus", "race": "Elf", "class": "Ranger"},
    {"player": "Matthew Mercer", "character": "Sir Julien Davinos", "race": "Human", "class": "Fighter"},
    {"player": "Whitney Moore", "character": "Tyranny", "race": "Tiefling", "class": "Sorcerer"},
    {"player": "Liam O'Brien", "character": "Halandil Fang", "race": "Orc", "class": "Bard"},
    {"player": "Marisha Ray", "character": "Murray Mag'Nesson", "race": "Dwarf", "class": "Barbarian"},
    {"player": "Sam Riegel", "character": "Wicander Halovar", "race": "Gnome", "class": "Wizard"},
    {"player": "Alexander Ward", "character": "Occtis Tachonis", "race": "Human", "class": "Wizard (Necromancy)"},
    {"player": "Travis Willingham", "character": "Teor Pridesire", "race": "Human", "class": "Fighter"},
]

CAST_STR = "CAST: Brennan Lee Mulligan (DM), " + ", ".join(
    f'{c["player"]} ({c["character"]})' for c in CAST
)

SPEAKER_MAP = {
    "AABRIA": "Thaisha Lloy (Aabria Iyengar)", "Aabria": "Thaisha Lloy (Aabria Iyengar)",
    "Aabria (Thaisha)": "Thaisha Lloy (Aabria Iyengar)", "Aabria Iyengar": "Thaisha Lloy (Aabria Iyengar)",
    "Aabria Iyengar (Thaisha Lloy)": "Thaisha Lloy (Aabria Iyengar)",
    "Thaisha (Aabria)": "Thaisha Lloy (Aabria Iyengar)", "Thaisha Lloy (Aabria)": "Thaisha Lloy (Aabria Iyengar)",
    "ASHLEY": "Vaelus (Ashley Johnson)", "Ashley": "Vaelus (Ashley Johnson)", "Ashley (Vaelus)": "Vaelus (Ashley Johnson)",
    "Alexander": "Occtis Tachonis (Alexander Ward)", "Alexander Ward (Occtis Tachonis)": "Occtis Tachonis (Alexander Ward)",
    "Alexander Ward (Occtis)": "Occtis Tachonis (Alexander Ward)", "Occtis (Alexander)": "Occtis Tachonis (Alexander Ward)",
    "Occtis Tachonis (Alexander)": "Occtis Tachonis (Alexander Ward)",
    "LAURA": "Thimble (Laura Bailey)", "Laura": "Thimble (Laura Bailey)", "Laura Bailey (Thimble)": "Thimble (Laura Bailey)",
    "Thimble (Laura)": "Thimble (Laura Bailey)",
    "LIAM": "Halandil Fang (Liam O'Brien)", "Liam": "Halandil Fang (Liam O'Brien)",
    "Liam (Hal)": "Halandil Fang (Liam O'Brien)", "Liam (Halandil)": "Halandil Fang (Liam O'Brien)",
    "Liam O'Brien": "Halandil Fang (Liam O'Brien)", "Halandil (Liam)": "Halandil Fang (Liam O'Brien)",
    'Liam O\'Brien (Halandil "Hal" Fang)': "Halandil Fang (Liam O'Brien)",
    "Halandil \"Hal\" Fang (Liam)": "Halandil Fang (Liam O'Brien)",
    "Halandil 'Hal' Fang (Liam)": "Halandil Fang (Liam O'Brien)",
    "Luis": "Azune Nayar (Luis Carazo)", "Luis Carazo (Azune Nayar)": "Azune Nayar (Luis Carazo)",
    "Luis Carazo (Azune)": "Azune Nayar (Luis Carazo)", "Azune (Luis)": "Azune Nayar (Luis Carazo)",
    "Azune Nayar (Luis)": "Azune Nayar (Luis Carazo)",
    "MARISHA": "Murray Mag'Nesson (Marisha Ray)", "Marisha": "Murray Mag'Nesson (Marisha Ray)",
    "Marisha (Murray)": "Murray Mag'Nesson (Marisha Ray)", "Murray (Marisha)": "Murray Mag'Nesson (Marisha Ray)",
    "MATT": "Sir Julien Davinos (Matthew Mercer)", "Matt": "Sir Julien Davinos (Matthew Mercer)",
    "Matt (Sir Julien)": "Sir Julien Davinos (Matthew Mercer)", "Sir Julien (Matt)": "Sir Julien Davinos (Matthew Mercer)",
    "SAM": "Wicander Halovar (Sam Riegel)", "Sam": "Wicander Halovar (Sam Riegel)",
    "Sam (Wick)": "Wicander Halovar (Sam Riegel)", "Sam Riegel": "Wicander Halovar (Sam Riegel)",
    'Sam Riegel (Wicander "Wick" Halovar)': "Wicander Halovar (Sam Riegel)",
    "Wick (Sam)": "Wicander Halovar (Sam Riegel)", 'Wicander "Wick" Halovar': "Wicander Halovar (Sam Riegel)",
    "TALIESIN": "Bolaire Lathalia (Taliesin Jaffe)", "Taliesin": "Bolaire Lathalia (Taliesin Jaffe)",
    "Taliesin (Bolaire)": "Bolaire Lathalia (Taliesin Jaffe)",
    "TRAVIS": "Teor Pridesire (Travis Willingham)", "Travis": "Teor Pridesire (Travis Willingham)",
    "Travis Willingham": "Teor Pridesire (Travis Willingham)", "Travis Willingham (Teor Pridesire)": "Teor Pridesire (Travis Willingham)",
    "Travis Willingham (Teor)": "Teor Pridesire (Travis Willingham)", "Teor (Travis)": "Teor Pridesire (Travis Willingham)",
    "Teor Pridesire (Travis)": "Teor Pridesire (Travis Willingham)",
    "WHITNEY": "Tyranny (Whitney Moore)", "Whitney (Tyranny)": "Tyranny (Whitney Moore)",
    "Whitney Moore (Tyranny)": "Tyranny (Whitney Moore)", "Tyranny": "Tyranny (Whitney Moore)",
    "Tyranny (Whitney)": "Tyranny (Whitney Moore)",
    "Robbie Daymond (Kattigan)": "Kattigan Vale (Robbie Daymond)",
    "Robbie": "Kattigan Vale (Robbie Daymond)", "ROBBIE": "Kattigan Vale (Robbie Daymond)",
    "KYLE": "NPC (DM)", "NPC": "DM (Brennan)",
    "Loza Blade (DM)": "DM (Brennan)", "Photarch": "DM (Brennan)",
    "Thjazi Fang (DM)": "DM (Brennan)", "Aspirant Enmity": "DM (Brennan)",
    "BRENNAN": "DM (Brennan)", "Brennan": "DM (Brennan)",
    "Unknown": "DM (Brennan)",
}

CHUNK_SIZE = 12000

def call_claude(system_prompt, user_prompt, retries=2):
    for attempt in range(retries + 1):
        body = json.dumps({
            "model": "claude-sonnet-4-20250514", "max_tokens": 6000,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}]
        }).encode()
        req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=body, headers={
            "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01"
        })
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read())
            text = result.get("content", [{}])[0].get("text", "[]")
            text = re.sub(r'^```json\s*', '', text.strip())
            text = re.sub(r'```\s*$', '', text.strip())
            m = re.search(r'\[\s*\{[\s\S]*\}\s*\]', text)
            if m:
                return json.loads(m.group(0))
            return json.loads(text)
        except json.JSONDecodeError:
            if attempt < retries:
                print(f"parse err, retry {attempt+1}...", end=" ", flush=True)
                time.sleep(2)
                continue
            try:
                last_brace = text.rfind('}')
                if last_brace > 0:
                    truncated = text[:last_brace+1].rstrip().rstrip(',') + ']'
                    m2 = re.search(r'\[\s*\{[\s\S]*\}\s*\]', truncated)
                    if m2:
                        return json.loads(m2.group(0))
            except:
                pass
            return None
        except Exception as e:
            if attempt < retries:
                print(f"err, retry {attempt+1}...", end=" ", flush=True)
                time.sleep(5)
                continue
            return None


def normalize_speakers(segments):
    changed = 0
    for seg in segments:
        old = seg.get("speaker", "")
        if old in SPEAKER_MAP:
            seg["speaker"] = SPEAKER_MAP[old]
            changed += 1
        for multi_key in ["LIAM and TRAVIS", "Aabria and Marisha", "Ashley and Aabria"]:
            if old == multi_key:
                seg["speaker"] = "Multiple"
                changed += 1
    return changed


def process_episode(ep_num):
    raw_path = f"/tmp/campaign4-raw-ep{ep_num}.json"
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(script_dir, "..", "src", "data", "campaigns")
    out_path = os.path.join(out_dir, f"campaign4-episode{ep_num}.json")
    
    if not os.path.exists(raw_path):
        print(f"ERROR: {raw_path} not found. Run Apify extraction first.")
        return None

    with open(raw_path) as f:
        raw = json.load(f)

    full_text = raw.get("fullText", "")
    if not full_text:
        print(f"ERROR: Empty transcript for episode {ep_num}")
        return None

    title = EPISODE_TITLES.get(ep_num, f"Episode {ep_num}")
    print(f"\n{'='*60}")
    print(f"Processing Episode {ep_num}: {title}")
    print(f"Transcript: {len(full_text):,} chars")

    sys_prompt = f"""You structure D&D transcripts into JSON. {CAST_STR}
World: Aramán. Episode {ep_num}: {title}.

Return ONLY a valid JSON array. Each element:
{{"segment_id":"E{ep_num}.C1.S1","type":"chapter_start|narration|dialogue|combat|description|ooc","speaker":"DM (Brennan)","content":"text","summary":null,"location":null,"characters_present":[],"timestamp_start":null,"timestamp_end":null,"metadata":{{"lore_keywords":[]}}}}

CRITICAL: Return ONLY the JSON array. No markdown. No extra text. Ensure all strings are properly escaped and terminated."""

    chunks = [full_text[i:i+CHUNK_SIZE] for i in range(0, len(full_text), CHUNK_SIZE)]
    print(f"Chunks: {len(chunks)}")

    all_segments = []
    ch, seg = 1, 1
    start_time = time.time()

    for i, chunk in enumerate(chunks):
        print(f"  Chunk {i+1}/{len(chunks)}...", end=" ", flush=True)
        prompt = f"Process chunk {i+1}/{len(chunks)} of Critical Role C4E{ep_num} '{title}'. State: C{ch}.S{seg}.\n\nTranscript:\n---\n{chunk}\n---\n\nReturn JSON array. Number from E{ep_num}.C{ch}.S{seg}."
        parsed = call_claude(sys_prompt, prompt)
        if parsed and isinstance(parsed, list) and len(parsed) > 0:
            all_segments.extend(parsed)
            print(f"OK ({len(parsed)} segs)")
            last = parsed[-1].get("segment_id", "")
            m = re.match(r'E\d+\.C(\d+)\.S(\d+)', last)
            if m:
                ch, seg = int(m.group(1)), int(m.group(2)) + 1
            else:
                seg += len(parsed)
        else:
            print("FALLBACK")
            all_segments.append({
                "segment_id": f"E{ep_num}.C{ch}.S{seg}", "type": "narration", "speaker": "DM (Brennan)",
                "content": chunk[:500] + "...", "summary": None, "location": None,
                "characters_present": [], "timestamp_start": None, "timestamp_end": None, "metadata": {}
            })
            seg += 1
        time.sleep(1)

    elapsed = time.time() - start_time
    norm_count = normalize_speakers(all_segments)

    doc = {
        "campaign": {"number": 4, "name": "Critical Role: Campaign 4", "world": "Aramán", "dm": "Brennan Lee Mulligan", "system": "D&D 2024 (5.5e)"},
        "episode": {"number": ep_num, "title": title, "air_date": raw.get("publishDate"), "duration_seconds": raw.get("durationSeconds"),
                     "youtube_url": EPISODE_URLS.get(ep_num, ""), "total_segments": len(all_segments), "total_chapters": ch},
        "cast": CAST,
        "segments": all_segments
    }

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(doc, f, indent=2, default=str)

    print(f"\nEpisode {ep_num} complete!")
    print(f"  Segments: {len(all_segments)}")
    print(f"  Speakers normalized: {norm_count}")
    print(f"  Time: {elapsed/60:.1f} min")
    print(f"  Saved: {out_path}")

    return {
        "ep": ep_num, "title": title, "segments": len(all_segments),
        "chars": len(full_text), "chunks": len(chunks),
        "time_min": round(elapsed / 60, 1), "date": datetime.now().strftime("%Y-%m-%d"),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 process-episode.py <ep_num> [ep_num2] ...")
        sys.exit(1)
    
    eps = [int(x) for x in sys.argv[1:]]
    results = []
    for ep in eps:
        result = process_episode(ep)
        if result:
            results.append(result)
            print(f"\n--- Episode {ep} done: {result['segments']} segments in {result['time_min']} min ---\n")
        else:
            print(f"\n--- Episode {ep} FAILED ---\n")
    
    print("\n=== Batch Summary ===")
    for r in results:
        print(f"  EP{r['ep']:2d}: {r['segments']:4d} segments, {r['chars']:>10,} chars, {r['time_min']:5.1f} min")
    print(f"  Total: {sum(r['segments'] for r in results)} segments across {len(results)} episodes")
