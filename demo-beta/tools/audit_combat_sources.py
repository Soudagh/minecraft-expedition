"""Inventory recipe/loot references in the exact locked combat and magic JARs.

This is a source inventory, not proof of runtime reachability or spell safety.
"""
import hashlib
import json
from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parents[1]
SELECT=('botania','mana-and-artifice','hex-casting','irons-spells','hazen','simply-swords','gregtech','sword-soaring')
def references(value):
    result=set()
    if isinstance(value,dict):
        for key,item in value.items():
            if key in ('item','tag','name','function','type','table','spell') and isinstance(item,str) and ':' in item:
                result.add((key,item))
            result.update(references(item))
    elif isinstance(value,list):
        for item in value:result.update(references(item))
    return result

def audit():
    lock=json.loads((ROOT/'mods.lock.json').read_text())
    report={'version':lock['version'],'scope':'Static references only; Java loot, trades, runtime functions and effects need separate analysis.','mods':[]}
    for mod in lock['mods']:
        identity=(mod['slug']+' '+mod['name']).lower()
        if not any(s in identity for s in SELECT) and not any(s in identity for s in ('m&a','hexcasting','mana and artifice','iron’s','irons spell','simplyswords')):continue
        jar=ROOT/'.cache/mods'/mod['filename']
        if hashlib.sha256(jar.read_bytes()).hexdigest()!=mod['hashes']['sha256']:raise ValueError('Unverified JAR: '+jar.name)
        entries=[]
        with zipfile.ZipFile(jar) as archive:
            for name in sorted(archive.namelist()):
                parts=name.split('/')
                if len(parts)<4 or parts[0]!='data' or parts[2] not in ('recipes','loot_tables') or not name.endswith('.json'):continue
                value=json.loads(archive.read(name))
                entries.append({'kind':parts[2],'id':parts[1]+':'+('/'.join(parts[3:])[:-5]),'type':value.get('type'),
                                'references':[{'kind':k,'id':v} for k,v in sorted(references(value))]})
        report['mods'].append({'name':mod['name'],'filename':mod['filename'],'sha256':mod['hashes']['sha256'],'entries':entries})
    destination=ROOT/'docs/COMBAT-SOURCES.json'
    destination.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    for mod in report['mods']:
        print(mod['name'],sum(e['kind']=='recipes' for e in mod['entries']),'recipes;',sum(e['kind']=='loot_tables' for e in mod['entries']),'loot tables')
    print(destination)
if __name__=='__main__':audit()
