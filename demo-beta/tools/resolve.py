"""Maintainer-only: resolve and download public mod releases, then freeze hashes."""
import json, hashlib, urllib.request, urllib.parse, zipfile, tomllib, subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from discover import get

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'mods'
CACHE.mkdir(parents=True, exist_ok=True)
ROOTS = ['create', 'gregtechceu-modern', 'better-combat', 'combat-roll',
 'simply-swords', 'hex-casting', 'botania', 'l_enders-cataclysm',
 'yungs-better-dungeons', 'chipped', 'framedblocks', 'kubejs', 'lootjs',
 'jei', 'modernfix', 'ferrite-core', 'embeddium', 'geckolib', 'curios',
 'caelus', 'patchouli', 'architectury-api', 'melody',
 'the-graveyard-forge', 'attributefix', 'huge-structure-blocks']
CLIENT_ONLY = {'embeddium', 'jei'}
resolved = {}
query = urllib.parse.urlencode({'game_versions': '["1.20.1"]', 'loaders': '["forge"]'})

def resolve(project_id, version_id=None):
    project = get('project/' + project_id)
    # Hex metadata pins older files, but its mods.toml accepts these versions.
    # Botania requires Patchouli >=83; retain the tested shared dependencies.
    version_id = {'patchouli': '94dtOLgZ', 'caelus': 'mRry0DgY'}.get(project['slug'], version_id)
    pid = project['id']
    if pid in resolved:
        if version_id and resolved[pid]['version_id'] != version_id:
            raise RuntimeError('Conflicting pinned dependency: ' + project['slug'])
        return
    if version_id:
        version = get('version/' + version_id)
    else:
        local = ROOT / 'metadata' / (project['slug'] + '.json')
        versions = json.loads(local.read_text())['versions'] if local.exists() else get('project/' + pid + '/version?' + query)
        # Prefer a release; projects like GTCEu only publish beta builds.
        version = next((v for v in versions if v['version_type'] == 'release'), versions[0])
    if '1.20.1' not in version['game_versions'] or 'forge' not in version['loaders']:
        raise RuntimeError('Wrong platform: ' + project['slug'])
    file = next((f for f in version['files'] if f['primary']), version['files'][0])
    resolved[pid] = {'name': project['title'], 'slug': project['slug'],
        'project_id': pid, 'version_id': version['id'], 'version': version['version_number'],
        'filename': file['filename'], 'url': file['url'], 'hashes': file['hashes'],
        'side': 'client' if project['slug'] in CLIENT_ONLY or project.get('server_side') == 'unsupported' else 'both',
        'source': 'https://modrinth.com/mod/' + project['slug'], 'dependencies': version['dependencies']}
    for dep in version['dependencies']:
        if dep['dependency_type'] == 'required':
            if dep['project_id']:
                resolve(dep['project_id'], dep['version_id'])
            elif dep['version_id']:
                dv = get('version/' + dep['version_id'])
                resolve(dv['project_id'], dv['id'])

def fetch_file(entry):
    dest = CACHE / entry['filename']
    if not dest.exists():
        req = urllib.request.Request(entry['url'], headers={'User-Agent': 'ExpeditionDemoBeta/0.1'})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        dest.write_bytes(data)
    data = dest.read_bytes()
    for kind, expected in entry.get('hashes', {}).items():
        if kind in ('sha1', 'sha512') and hashlib.new(kind, data).hexdigest() != expected:
            raise RuntimeError('Hash mismatch: ' + dest.name)
    if not zipfile.is_zipfile(dest):
        raise RuntimeError('Not a jar: ' + dest.name)
    entry['hashes'] = {k: hashlib.new(k, data).hexdigest() for k in ('sha1','sha512','sha256')}
    entry['size'] = len(data)
    print('Verified', dest.name, flush=True)
    return entry

if __name__ == '__main__':
    for slug in ROOTS:
        print('Resolve', slug, flush=True)
        resolve(slug)
    # FTB distributes these releases through CurseForge, not Modrinth.
    for slug, pid in [('ftb-library-forge',404465), ('ftb-teams-forge',404468),
                      ('ftb-quests-forge',289412), ('ftb-xmod-compat',889915),
                      ('mana-and-artifice',406360), ('eeeabs-mobs',921600),
                      ('souls-like-bosses',1167801)]:
        local_meta = ROOT/'metadata'/(slug+'-cf.json')
        if not local_meta.exists():
            subprocess.run(['curl','-fsSL','https://api.cfwidget.com/'+str(pid),'-o',str(local_meta)],check=True)
        meta = json.loads(local_meta.read_text())
        (ROOT/'metadata'/ (slug+'-cf.json')).write_text(json.dumps(meta,ensure_ascii=False,indent=2))
        # Boss mods have deliberately selected files; do not switch to alternate editions.
        pinned = {'eeeabs-mobs': 8073814, 'souls-like-bosses': 7955163}
        f = next(f for f in meta['files'] if f['id'] == pinned[slug]) if slug in pinned else next(
            f for f in meta['files'] if '1.20.1' in f['versions'] and 'forge' in f['name'].lower())
        fid = f['id']; filename = f['name']
        resolved[slug] = {'name': slug, 'slug': slug, 'version':filename, 'filename':filename,
          'url':f'https://mediafilez.forgecdn.net/files/{fid//1000}/{fid%1000}/{urllib.parse.quote(filename)}',
          'hashes':{}, 'side':'both', 'source': f['url'], 'curseforge_project_id':pid, 'curseforge_file_id':fid}
    with ThreadPoolExecutor(max_workers=5) as pool:
        entries = list(pool.map(fetch_file, resolved.values()))
    lock={'name':'Expedition Demo Beta', 'version':'0.3.0-dev', 'save_schema':2, 'minecraft':'1.20.1',
          'forge':'47.4.10','java':17,'mods':sorted(entries,key=lambda x:x['slug'])}
    (ROOT/'mods.lock.json').write_text(json.dumps(lock,ensure_ascii=False,indent=2)+'\n')
    print('LOCKED', len(entries), 'mods')
