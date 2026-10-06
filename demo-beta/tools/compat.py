"""Generate narrow SLB 3.4 compatibility overrides from the verified local JAR.

No third-party function files are distributed in this repository. Generated
files are instance-owned and hashed by install.py, like regular overrides.
"""
import json
import re
import zipfile


def boss_overrides(entries, cache):
    entry = next((m for m in entries if m.get('slug') == 'souls-like-bosses'), None)
    if entry is None:
        return {}
    if entry.get('curseforge_file_id') != 7955163:
        raise ValueError('SLB compatibility fixes require the verified 3.4 file 7955163')
    result = {}
    with zipfile.ZipFile(cache / entry['filename']) as jar:
        for name in jar.namelist():
            if not name.startswith('data/') or not name.endswith('.mcfunction'):
                continue
            original = jar.read(name).decode('utf-8')
            lines = []
            for line in original.splitlines():
                if line.startswith('execut '):
                    line = 'execute ' + line[len('execut '):]
                if ' run #playsound ' in line:
                    line = '# Expedition: disabled upstream sound keyframe'
                line = re.sub(r'(run damage @s 8 generic)\]$', r'\1', line)
                for target in ('aw', 'nl'):
                    line = line.replace('type=!player,type=#souls_like_bosses:' + target + '_target',
                                        'type=#expedition:slb_' + target + '_mob_targets')
                if line.startswith('summon item ') and '"{"text":"Right-Click in Offhand:' in line:
                    # Repair only two broken JSON lore strings; retain reward stats/NBT.
                    start = line.index('"{"text":"Right-Click in Offhand:')
                    end = line.index(',    ', start)
                    lore = [json.dumps(json.dumps({'text': text, 'italic': False, 'color': 'aqua'}))
                            for text in ('Right-Click in Offhand: Summon Crystal Soulmasses',
                                         'Sneak + Right-Click in Offhand: Release Soul Stream')]
                    line = line[:start] + ','.join(lore) + line[end:]
                lines.append(line)
            modified = '\n'.join(lines) + '\n'
            if name.endswith('/bosses/lothran/epicfight_stamina.mcfunction'):
                modified = '# Expedition: optional Epic Fight is not installed.\n'
            if name.endswith('/adjust_config/mob_battle_mark_nearest_mob.mcfunction'):
                modified = 'tellraw @s {"text":"Mob battle debug mode requires Carpet; disabled in Expedition."}\n'
            if modified.replace('\n', '') != original.replace('\r', '').replace('\n', ''):
                result['kubejs/' + name] = modified.encode('utf-8')
        for target in ('aw', 'nl'):
            data = json.loads(jar.read('data/souls_like_bosses/tags/entity_types/' + target + '_target.json'))
            data['values'] = [v for v in data['values'] if v != 'minecraft:player']
            result['kubejs/data/expedition/tags/entity_types/slb_' + target + '_mob_targets.json'] = (
                json.dumps(data) + '\n').encode('utf-8')
    return result
