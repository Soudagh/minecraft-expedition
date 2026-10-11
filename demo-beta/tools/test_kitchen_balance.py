"""Preserve native keg requirements; starters add supply without increasing slots."""
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from build_kitchen_balance import ROOT, DRINKS, build


class KitchenContracts(unittest.TestCase):
    def test_native_recipe_and_replaced_ingredient_preserved(self):
        mod = next(m for m in json.loads((ROOT/'mods.lock.json').read_text())['mods'] if m['filename'].startswith('BrewinAndChewin-'))
        jar = ROOT / '.cache/mods' / mod['filename']
        with zipfile.ZipFile(jar) as z, tempfile.TemporaryDirectory() as tmp:
            report = build(jar, Path(tmp))
            for name, (ingredient, starter, material, stage) in DRINKS.items():
                old = json.loads(z.read(f'data/brewinandchewin/recipes/fermenting/{name}.json'))
                path = ROOT/f'overrides/kubejs/data/brewinandchewin/recipes/fermenting/{name}.json'
                new = json.loads(path.read_text())
                self.assertEqual(new,report['recipes']['brewinandchewin:fermenting/'+name])
                self.assertLessEqual(len(new['ingredients']),4)
                index = new['ingredients'].index({'item':'kubejs:'+starter})
                new['ingredients'][index] = {'item':ingredient}
                self.assertEqual(old,new)
                self.assertEqual(old['result']['count'],1000)
                self.assertIn('kubejs:material_'+material, (ROOT/'overrides/kubejs/server_scripts/expedition_kitchen_recipes.js').read_text())

    def test_changed_upstream_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);jar=root/'wrong.jar';jar.write_bytes(b'wrong version')
            with self.assertRaisesRegex(ValueError,'differs'):build(jar,root)
            self.assertFalse((root/'overrides').exists())


if __name__=='__main__':unittest.main()
