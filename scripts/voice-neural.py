#!/usr/bin/env python3
"""Generate file-backed neural vocabulary speech using Microsoft Edge TTS.

Setup: python3 -m venv .cache/voice-env
       .cache/voice-env/bin/pip install -r scripts/voice/requirements.txt
Run:   .cache/voice-env/bin/python scripts/voice-neural.py [day-10 ...]

Output uses a new directory to avoid cached macOS audio. Existing recordings
remain usable until every replacement in a lesson has succeeded. No runtime API.
"""
import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
import sys
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
VOICES = {'us': 'en-US-AriaNeural', 'uk': 'en-GB-SoniaNeural'}
RATE = '-8%'
CACHE = ROOT / '.cache' / 'neural-voice'
LIMIT = None
FORCE = False

async def recording(text, accent, target, reuse):
    if reuse and target.exists() and target.stat().st_size > 1000:
        return
    key = hashlib.sha256(f'{text}|{VOICES[accent]}|{RATE}'.encode()).hexdigest()
    cached = CACHE / f'{key}.mp3'
    async with LIMIT:
        if FORCE or not cached.exists():
            for attempt in range(3):
                temp = cached.with_suffix(f'.{os.getpid()}.tmp')
                try:
                    await edge_tts.Communicate(text, VOICES[accent], rate=RATE,
                                               connect_timeout=15, receive_timeout=30).save(str(temp))
                    if temp.stat().st_size < 1000:
                        raise RuntimeError('Empty or truncated recording')
                    temp.replace(cached)
                    break
                except Exception:
                    temp.unlink(missing_ok=True)
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2 * (attempt + 1))
        target.parent.mkdir(parents=True, exist_ok=True)
        # Keep the MP3 stream intact: no playback-rate baking or re-encoding.
        target.write_bytes(cached.read_bytes())

async def lesson(slug):
    file = ROOT / 'content' / slug / 'vocabulary.json'
    data = json.loads(file.read_text())
    generation = {'provider': 'Microsoft Edge TTS', 'voices': VOICES, 'rate': RATE, 'package': 'edge-tts 7.3.1',
                  'textHash': hashlib.sha256(json.dumps([(word['id'], word['word']) for word in data['items']], ensure_ascii=False).encode()).hexdigest()}
    reuse = not FORCE and data.get('voiceGeneration') == generation
    jobs = []
    for word in data['items']:
        for accent in VOICES:
            target = ROOT / 'public' / 'assets' / slug / 'voice-neural' / f'{word["id"]}-{accent}.mp3'
            jobs.append(recording(word['word'], accent, target, reuse))
    results = await asyncio.gather(*jobs, return_exceptions=True)
    errors = [str(result) for result in results if isinstance(result, Exception)]
    if errors:
        raise RuntimeError(f'{slug}: {len(errors)} recordings failed; content unchanged. {errors[0]}')
    # Snapshot originals before touching metadata. Audio can be resumed safely.
    backup = CACHE / f'{slug}-before.json'
    if not backup.exists():
        backup.write_text(file.read_text())
    for word in data['items']:
        word['voice'] = {accent: f'/assets/{slug}/voice-neural/{word["id"]}-{accent}.mp3' for accent in VOICES}
        word.setdefault('source', {})['voice'] = 'tts'
    data['voiceGeneration'] = generation
    # Do not overwrite vocabulary edited while this lesson was generating.
    current = json.loads(file.read_text())
    current_words = [{k: v for k, v in word.items() if k not in ('voice', 'source')} for word in current['items']]
    expected_words = [{k: v for k, v in word.items() if k not in ('voice', 'source')} for word in data['items']]
    if current_words != expected_words:
        raise RuntimeError(f'{slug}: vocabulary changed during generation; rerun to merge safely')
    for generated, original in zip(data['items'], current['items']):
        generated['source'] = {**original.get('source', {}), 'voice': 'tts'}
    data = {**current, 'items': data['items'], 'voiceGeneration': data['voiceGeneration']}
    temporary = file.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(file)
    print(f'{slug}: {len(jobs)} neural recordings ready', flush=True)

async def main():
    global LIMIT, FORCE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("slugs", nargs="*")
    parser.add_argument("--force", action="store_true")
    options = parser.parse_args()
    FORCE = options.force
    LIMIT = asyncio.Semaphore(4)
    CACHE.mkdir(parents=True, exist_ok=True)
    slugs = options.slugs or json.loads((ROOT / 'content' / 'days.json').read_text())['days']
    for slug in slugs:
        if slug not in json.loads((ROOT / 'content' / 'days.json').read_text())['days']:
            raise ValueError(f'Unknown lesson: {slug}')
        await lesson(slug)

if __name__ == '__main__':
    asyncio.run(main())
