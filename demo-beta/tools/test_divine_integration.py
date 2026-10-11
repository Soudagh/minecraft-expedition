"""Verify the new graph and all effective HBM templates/loot, using the locked JAR."""
import gzip, io, json, unittest, zipfile, tempfile
from pathlib import Path
from build_hbm_peaceful import ROOT, forbidden, sanitize_structure
from divine_quests import write_divine
import nbtlib

class IntegrationTests(unittest.TestCase):
    def test_graph_is_reproducible_and_registry_backed(self):
        book=ROOT/'overrides/config/ftbquests/quests';path=book/'chapters/divine_rpg.snbt';before=path.read_bytes()
        with tempfile.TemporaryDirectory() as tmp:
            generated=Path(tmp);(generated/'chapters').mkdir();write_divine(generated);first=(generated/'chapters/divine_rpg.snbt').read_bytes();write_divine(generated);self.assertEqual(first,(generated/'chapters/divine_rpg.snbt').read_bytes())
        c=json.loads(before);self.assertEqual(len(c['quests']),40)
        with zipfile.ZipFile(ROOT/'.cache/mods/DivineRPG-1.10.7.5.jar') as z:
            for q in c['quests']:
                for t in q['tasks']:
                    if t['type']=='item':
                        self.assertFalse(t['consume_items'])
                        if t['item'].startswith('divinerpg:'):self.assertIn('assets/divinerpg/models/item/'+t['item'].split(':')[1]+'.json',z.namelist())
                    elif t['type']=='advancement':self.assertIn('data/'+t['advancement'].replace(':','/advancements/')+'.json',z.namelist())

    def test_all_effective_hbm_structures_and_loot_are_filtered(self):
        lock=json.loads((ROOT/'mods.lock.json').read_text());entry=next(m for m in lock['mods'] if m['slug']=='hbms-nuclear-tech-modernized')
        def walk(value):
            if isinstance(value,dict):
                for k,v in value.items():
                    if k in ('id','Name','name') and isinstance(v,str):self.assertFalse(forbidden(v),v)
                    walk(v)
            elif isinstance(value,list):
                for v in value:walk(v)
        with zipfile.ZipFile(ROOT/'.cache/mods'/entry['filename']) as z:
            templates=loot=0
            for name in z.namelist():
                override=ROOT/'overrides/kubejs'/name
                if name.startswith('data/hbm_m/structures/') and name.endswith('.nbt'):
                    raw=z.read(name);effective=override.read_bytes() if override.exists() else raw
                    original=nbtlib.File.parse(io.BytesIO(gzip.decompress(raw)));new=nbtlib.File.parse(io.BytesIO(gzip.decompress(effective)));walk(new)
                    self.assertEqual(original['size'],new['size']);self.assertEqual(len(original.get('blocks',[])),len(new.get('blocks',[])))
                    for a,b in zip(original.get('palette',[]),new.get('palette',[])):
                        if not forbidden(a.get('Name','')):self.assertEqual(a,b)
                    if override.exists():self.assertEqual(effective,sanitize_structure(raw)[0])
                    templates+=1
                elif name.startswith('data/hbm_m/loot_tables/') and name.endswith('.json'):
                    walk(json.loads(override.read_bytes() if override.exists() else z.read(name)));loot+=1
            self.assertGreater(templates,20);self.assertGreater(loot,50)

    def test_industrial_materials_stay_available(self):
        for id in ['hbm_m:gunmetal_ingot','hbm_m:plate_gunsteel','hbm_m:zirnox','hbm_m:rbmk_rod_uranium','hbm_m:steel_ingot','hbm_m:charge_miner','hbm_m:gun_fireext']:
            self.assertFalse(forbidden(id),id)
        for id in ['hbm_m:gun_b92','hbm_m:ammo_9mm_sp','hbm_m:naval_mine','hbm_m:crate_weapon','hbm_m:turret_sentry','hbm_m:gun_kit_1']:
            self.assertTrue(forbidden(id),id)

if __name__=='__main__':unittest.main()
