"""Archive pinned SLB control evidence; no live boss or client combat is run."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def main():
    lock = json.loads((ROOT / 'mods.lock.json').read_text())
    mod = next(m for m in lock['mods'] if m['filename'].startswith('Souls_Like_Bosses'))
    jar = ROOT / '.cache/mods' / mod['filename']
    digest = hashlib.sha256(jar.read_bytes()).hexdigest()
    if digest != mod['hashes']['sha256']:
        raise ValueError('Pinned SLB hash mismatch')
    evidence = {}
    slow_refs = {}
    count = 0
    with zipfile.ZipFile(jar) as archive:
        for name in sorted(archive.namelist()):
            if not name.endswith('.mcfunction'):
                continue
            count += 1
            text = archive.read(name).decode('utf-8')
            active = [line for line in text.splitlines() if line.strip() and not line.lstrip().startswith('#')]
            if name.startswith('data/souls_like_bosses/functions/bosses/'):
                if name.rsplit('/', 1)[-1] in {'main.mcfunction','boss_start.mcfunction','running_to_target.mcfunction','walking_backwards.mcfunction'}:
                    evidence[name] = text
            if any('summon slime' in line and 'boss_hitbox' in text for line in active) or any('NoAI:1b' in line and ('cow' in line or 'slime' in line) for line in active):
                evidence[name] = text
            refs = [line for line in active if 'slowness' in line or 'movement_speed' in line]
            if refs:
                slow_refs[name] = refs
    result = {'gameVersion':lock['version'],'scope':'Static packaged functions only; not boss effect acceptance, live phase behavior, client cadence or DPS.',
              'jar':{'filename':jar.name,'sha256':digest}, 'functionCount':count,
              'selectedFunctions':evidence,'activeSlownessOrMovementSpeedReferences':slow_refs}
    dest = ROOT / 'docs/BOSS-CONTROL-SOURCES-0.31.json'
    dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(f'{dest}: {count} functions, {len(evidence)} evidence files, {len(slow_refs)} speed-reference files')

if __name__ == '__main__':
    main()
