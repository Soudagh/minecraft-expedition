"""Contracts for verified upstream hooks and the no-boss-farming material chain.

Runtime acceptance checks are recorded separately in release diagnostics.
"""
import unittest
import tempfile
from pathlib import Path
import json
import compat
import build_progression
from progression import STAGES, HULL_STAGES, SLB_HOOKS

class ProgressionContracts(unittest.TestCase):
    def test_no_forward_or_self_dependencies_in_processing(self):
        indices={f'kubejs:material_{slug}':n for n,slug,*_ in STAGES}
        for n,slug,_,_,inputs in STAGES:
            for item,count in inputs:
                self.assertGreater(count,0)
                if item in indices:self.assertLess(indices[item],n)
            # Each renewed batch costs previous materials, never a boss drop.
            self.assertFalse(any('soul' in item or 'trophy' in item for item,_ in inputs))
        self.assertEqual(len({slug for _,slug,*_ in STAGES}),9)

    def test_hooks_do_not_celebrate_nested_phantoms(self):
        lock=json.loads((Path(__file__).resolve().parents[1]/'mods.lock.json').read_text())
        cache=Path(__file__).resolve().parents[1]/'.cache/mods'
        generated=compat.boss_overrides(lock['mods'],cache)
        hooks={k:v.decode() for k,v in generated.items() if b'function expedition:progression/win/' in v}
        self.assertEqual(len(hooks),6)
        for boss,(slug,root) in SLB_HOOKS.items():
            key=f'kubejs/data/souls_like_bosses/functions/bosses/{boss}/boss_died.mcfunction'
            self.assertIn(key,hooks)
            first=hooks[key].splitlines()[0]
            self.assertIn('type=minecraft:item_display',first)
            self.assertIn('tag='+root,first)
            self.assertIn('tag=exp_player_engaged_v1',first)
            self.assertIn('tag=!mob_battle',first)
        self.assertIn('boss_phase=2',hooks['kubejs/data/souls_like_bosses/functions/bosses/aw/boss_died.mcfunction'].splitlines()[0])

    def test_insufficient_batch_cannot_consume_inputs(self):
        with tempfile.TemporaryDirectory() as name:
            before_root,before_data=build_progression.ROOT,build_progression.DATA
            try:
                build_progression.ROOT=Path(name)
                build_progression.DATA=Path(name)/'kubejs/data/expedition'
                build_progression.build()
                for _,slug,*_ in STAGES:
                    data=(build_progression.DATA/f'functions/processing/{slug}/check.mcfunction').read_text()
                    for line in data.splitlines():
                        if 'run clear @s' in line:self.assertTrue(line.endswith(' 0'))
                    self.assertIn('if score @s exp_batch matches 1 run function',data)
                recipes=(build_progression.ROOT/'kubejs/server_scripts/expedition_progression_recipes.js').read_text()
                for tier in HULL_STAGES:self.assertIn("output:'gtceu:"+tier+"_machine_hull'",recipes)
                self.assertIn("'kubejs:attuned_core','kubejs:material_annihilator'",recipes)
            finally:
                build_progression.ROOT,build_progression.DATA=before_root,before_data

if __name__=='__main__':unittest.main()
