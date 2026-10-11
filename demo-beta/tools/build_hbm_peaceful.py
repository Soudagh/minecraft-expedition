"""Strip military content from locked HBM loot and structure templates.
Maintainer dependency: nbtlib==2.0.4. Runtime/install have no new Python dependency.
"""
import gzip, hashlib, io, json, re, zipfile
from pathlib import Path
import nbtlib

ROOT=Path(__file__).resolve().parents[1]
# Shared industrial metals, nuclear fuel, reactors and mining tools stay available.
WEAPONS=re.compile(r'^hbm_m:(?:gun_(?!fireext)|ammo_(?!fireext)|grenade|missile_|machine_missile|turret_|rocket_|nuke_|detonator|multi_detonator|range_detonator|airstrike_|airbomb|airnukebomb|barbed_wire|mine_|naval_mine|crate_weapon|crate_ammo|assembly_nuke|custom_nuke|dud_nuke|det_nuke|bomb_|balebomb|fissure_bomb|smoke_bomb|boltgun|chopper_gun|compact_launcher|boy_bullet|mold_shell|struct_launcher)')

def forbidden(value): return bool(WEAPONS.match(str(value)))

def clean_loot(value,removed):
    if isinstance(value,dict):
        if value.get('type') in ('item','minecraft:item') and forbidden(value.get('name','')):
            removed.append(value['name']);return None
        return {k:clean_loot(v,removed) for k,v in value.items() if k!='_comment'}
    if isinstance(value,list):return [new for v in value if (new:=clean_loot(v,removed)) is not None]
    return value

def clean_nbt(value,removed):
    if isinstance(value,nbtlib.Compound):
        for key in list(value):
            if key in ('Items','items','Inventory') and isinstance(value[key],nbtlib.List):
                original=value[key];kept=[]
                for item in original:
                    if isinstance(item,dict) and forbidden(item.get('id','')):removed.append(str(item['id']))
                    else:kept.append(item)
                value[key]=type(original)(kept)
            else:clean_nbt(value[key],removed)
    elif isinstance(value,nbtlib.List):
        for child in value:clean_nbt(child,removed)

def sanitize_structure(raw):
    data=nbtlib.File.parse(io.BytesIO(gzip.decompress(raw)));removed=[];indices=set()
    palettes=list(data.get('palettes',[])) or [data.get('palette',[])]
    for palette in palettes:
        for i,state in enumerate(palette):
            if forbidden(state.get('Name','')):indices.add(i);removed.append(str(state['Name']));palette[i]=nbtlib.Compound({'Name':nbtlib.String('minecraft:air')})
    for block in data.get('blocks',[]):
        if int(block['state']) in indices:block.pop('nbt',None)
    clean_nbt(data,removed)
    output=io.BytesIO();data.write(output)
    return gzip.compress(output.getvalue(),mtime=0),removed

def build():
    lock=json.loads((ROOT/'mods.lock.json').read_text());entry=next(m for m in lock['mods'] if m['slug']=='hbms-nuclear-tech-modernized');jar=ROOT/'.cache/mods'/entry['filename']
    assert hashlib.sha256(jar.read_bytes()).hexdigest()==entry['hashes']['sha256']
    target=ROOT/'overrides/kubejs';report={'jarSHA256':entry['hashes']['sha256'],'templates':[],'loot':[]}
    with zipfile.ZipFile(jar) as z:
        for name in sorted(z.namelist()):
            if name.startswith('data/hbm_m/structures/') and name.endswith('.nbt'):
                result,removed=sanitize_structure(z.read(name))
                if removed:
                    p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(result);report['templates'].append({'path':name,'removed':removed})
            elif name.startswith('data/hbm_m/loot_tables/') and name.endswith('.json'):
                removed=[];result=clean_loot(json.loads(z.read(name)),removed)
                if removed:
                    p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');report['loot'].append({'path':name,'removed':removed})
    (ROOT/'docs/HBM-PEACEFUL-0.35.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('HBM sanitized:',len(report['templates']),'templates,',len(report['loot']),'loot tables')
if __name__=='__main__':build()
