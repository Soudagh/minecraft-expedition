"""Read public Modrinth metadata; never installs or launches anything."""
import json
import urllib.request
import urllib.parse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1]
SLUGS = ['create', 'gregtechceu-modern', 'better-combat', 'combat-roll',
         'simply-swords', 'hex-casting', 'botania', 'cataclysm',
         'yungs-better-dungeons', 'chipped', 'framedblocks', 'kubejs',
         'lootjs', 'ftb-quests', 'ftb-teams', 'ftb-xmod-compat', 'jei',
         'modernfix', 'ferrite-core', 'embeddium', 'geckolib', 'curios', 'playeranimator', 'caelus', 'patchouli', 'ftb-library', 'l_enders-cataclysm']

def get(path):
    req = urllib.request.Request('https://api.modrinth.com/v2/' + path,
        headers={'User-Agent': 'ExpeditionDemoBeta/0.1 (private modpack research)'})
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.load(response)

def discover(slug):
    try:
        project = get('project/' + slug)
        query = urllib.parse.urlencode({'game_versions': '["1.20.1"]', 'loaders': '["forge"]'})
        versions = get('project/' + slug + '/version?' + query)
        (ROOT / 'metadata' / (slug + '.json')).write_text(json.dumps(
            {'project': project, 'versions': versions}, ensure_ascii=False, indent=2))
        return slug, [(v['id'], v['version_number'], v['version_type']) for v in versions[:3]]
    except Exception as exc:
        return slug, str(exc)

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=5) as pool:
        for result in pool.map(discover, SLUGS):
            print(json.dumps(result, ensure_ascii=False), flush=True)
