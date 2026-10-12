"""Campaign graph contracts; actual Forge events are exercised by native QA."""
import json
import tempfile
import unittest
from pathlib import Path
from cataclysm_quests import write_cataclysm, POLICY
from divine_quests import write_divine, DIMENSIONS

ROOT=Path(__file__).resolve().parents[1]

class CataclysmCampaignTests(unittest.TestCase):
    def test_ignis_is_final_and_all_realms_use_same_policy(self):
        policy=json.loads(POLICY.read_text())
        self.assertEqual([b['order'] for b in policy['bosses']],list(range(1,9)))
        self.assertEqual(len({b['entity'] for b in policy['bosses']}),8)
        self.assertEqual(policy['bosses'][-1]['entity'],'cataclysm:ignis')
        self.assertEqual(policy['dimensions'],{'divinerpg:'+r:s for r,_,s in DIMENSIONS})

    def test_generated_graph_is_deterministic_and_first_divine_requires_ignis(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'overrides/config/ftbquests/quests';(root/'chapters').mkdir(parents=True)
            cat=write_cataclysm(root);divine=write_divine(root)
            before=(root/'chapters/cataclysm.snbt').read_bytes();write_cataclysm(root)
            self.assertEqual(before,(root/'chapters/cataclysm.snbt').read_bytes())
            self.assertEqual(divine[0]['dependencies'],[cat[-1]['id']])
            for q in cat:
                self.assertEqual(q['tasks'][0]['type'],'advancement')
            self.assertFalse(any('1400000000000000' in q.get('dependencies',[]) for q in divine))

    def test_gear_tracks_realm_available_before_next_boss(self):
        gear=json.loads((ROOT/'overrides/kubejs/config/divine_balance.json').read_text())['gear']
        policy=json.loads(POLICY.read_text())
        for realm in ['eden','wildwood','apalachia','skythern','mortum']:
            for suffix in ['blade','helmet','chestplate','leggings','boots']:
                self.assertEqual(gear['divinerpg:'+realm+'_'+suffix]['stage'],policy['dimensions']['divinerpg:'+realm])

    def test_slb_sunflower_phase_health_and_visible_bar_match_profile(self):
        from compat import boss_overrides
        lock=json.loads((ROOT/'mods.lock.json').read_text())
        files=boss_overrides(lock['mods'],ROOT/'.cache/mods')
        values=[v.decode() for k,v in files.items() if 'gigant_sunflower/' in k and k.endswith('effects_0.mcfunction')]
        joined='\n'.join(values)
        self.assertIn('Health:3000',joined)
        self.assertNotIn('Health:900',joined)
        self.assertIn('boss_health matches ..1700',joined)
        import zipfile
        entry=next(m for m in lock['mods'] if m['slug']=='souls-like-bosses')
        leaf='data/animated_java/functions/gigant_sunflower/zzzzzzzz/animations/swing_attack_window/tree/leaf_15_effects_0.mcfunction'
        with zipfile.ZipFile(ROOT/'.cache/mods'/entry['filename']) as jar:
            effective=files.get('kubejs/'+leaf,jar.read(leaf)).decode()
        self.assertIn('boss_health matches ..400',effective)
        self.assertIn('sunflower max 2600',joined)
        self.assertNotIn('sunflower max 350',joined)

    def test_legacy_stages_survive_and_future_wins_cannot_be_banked(self):
        load=(ROOT/'overrides/kubejs/data/expedition/functions/progression/load.mcfunction').read_text()
        self.assertIn('execute unless score $expedition exp_cat matches 0..',load)
        self.assertNotIn('\nscoreboard players set $expedition exp_cat 0',load)
        for n,slug in enumerate(['watchers','champion','lothric','sunflower','annihilator','cinder','nightlord','melkor','realmwarden'],1):
            text=(ROOT/f'overrides/kubejs/data/expedition/functions/progression/win/{slug}.mcfunction').read_text()
            self.assertIn('execute unless score $expedition exp_cat matches 8.. run return 0',text)
            self.assertIn(f'execute unless score $expedition exp_stage matches {n-1} run return 0',text)

if __name__=='__main__':unittest.main()
