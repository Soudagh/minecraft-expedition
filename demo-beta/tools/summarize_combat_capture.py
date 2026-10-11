"""Summarize completed QA capture: observed hit intervals, effects and samples.

Never derives DPS or final HP loss from NORMAL-priority damage events.
"""
import argparse
from collections import defaultdict
import json
import math
from pathlib import Path
from statistics import mean, median


def summarize(capture):
    if capture.get('enabled') is not False:
        raise ValueError('Stop the capture before analyzing it')
    if capture.get('dropped') != 0 or capture.get('errors') != []:
        raise ValueError('Incomplete capture: dropped rows or diagnostic errors')
    hits, samples = defaultdict(list), defaultdict(list)
    for row in capture['rows']:
        tick = row.get('tick')
        if not isinstance(tick, (int, float)) or not math.isfinite(tick):
            raise ValueError('Missing or invalid server tick')
        if row['kind'] == 'living_damage' and not row.get('canceled', False):
            amount = row['observedAmount']
            if not isinstance(amount, (int, float)) or not math.isfinite(amount) or amount < 0:
                raise ValueError('Invalid observed event amount')
            if amount > 0:
                hits[(row['player'], row['target'])].append(row)
        elif row['kind'] == 'sample':
            samples[row['player']].append(row)
    result = {
        'session': capture['session'],
        'scope': 'Successful observed LivingDamage events at NORMAL priority; hit intervals in server ticks, not input/swing cadence. Amount sum is not final HP loss or DPS. Effects are fractions of recorded player samples, not guaranteed whole-session uptime. No client misses recorded.',
        'rows': len(capture['rows']), 'targets': [], 'players': [],
    }
    for (player, target), events in sorted(hits.items()):
        ticks = sorted(e['tick'] for e in events)
        intervals = [b-a for a,b in zip(ticks, ticks[1:])]
        result['targets'].append({
            'player': player, 'target': target, 'observedPositiveDamageEvents': len(events),
            'firstHitTick': ticks[0], 'lastHitTick': ticks[-1],
            'observedAmountSum': sum(e['observedAmount'] for e in events),
            'sameTickHitIntervals': sum(i==0 for i in intervals),
            'hitIntervalsTicks': intervals,
            'meanHitIntervalTicks': mean(intervals) if intervals else None,
            'medianHitIntervalTicks': median(intervals) if intervals else None,
        })
    for player, rows in sorted(samples.items()):
        ticks = {r['tick'] for r in rows}
        if len(ticks) != len(rows):
            raise ValueError('Duplicate player sample tick: ' + player)
        effects = defaultdict(int)
        for row in rows:
            for effect in row['effects']:
                effects[(effect['id'], effect['amplifier'])] += 1
        stamina = [r['epicFight']['stamina'] for r in rows if r.get('epicFight')]
        result['players'].append({
            'player': player, 'samples': len(rows),
            'sampleTickCoverage': len(ticks)/(max(ticks)-min(ticks)+1),
            'weapons': sorted({r['weapon'] for r in rows}),
            'effects': [{'id': name, 'amplifier': amp, 'observedSamples': count,
                         'recordedSampleFraction': count/len(rows)}
                        for (name,amp),count in sorted(effects.items())],
            'minRecordedStamina': min(stamina) if stamina else None,
            'maxRecordedStamina': max(stamina) if stamina else None,
        })
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    text = json.dumps(summarize(json.loads(args.capture.read_text())), ensure_ascii=False, indent=2)+'\n'
    if args.output:
        args.output.write_text(text)
    else:
        print(text, end='')
