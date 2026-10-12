"""Check native upgrade preservation and all alternate recipe paths."""
import json
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class DraconicRecipesTests(unittest.TestCase):
    def test_every_native_fusion_tool_retains_prerequisites_and_costs(self):
        lock = json.loads((ROOT / 'mods.lock.json').read_text())
        mod = next(m for m in lock['mods'] if m['slug'] == 'draconic-evolution')
        count = 0
        with zipfile.ZipFile(ROOT / '.cache/mods' / mod['filename']) as jar:
            for name in jar.namelist():
                if '/recipes/tools/' not in name or not name.endswith('.json'):
                    continue
                base = json.loads(jar.read(name))
                if base['type'] != 'draconicevolution:fusion_crafting':
                    continue
                count += 1
                effective = json.loads((ROOT / 'overrides/kubejs' / name).read_text())
                extra = effective['ingredients'][len(base['ingredients']):]
                self.assertEqual(effective['ingredients'][:len(base['ingredients'])], base['ingredients'])
                for key in ['catalyst', 'result', 'tier', 'total_energy']:
                    self.assertEqual(effective[key], base[key], name)
                repeats = 2 if base['tier'] == 'CHAOTIC' else 1
                motor = 'gtceu:zpm_electric_motor' if base['tier'] == 'WYVERN' else 'gtceu:uv_electric_motor'
                self.assertEqual(extra, [{'item': x} for x in [motor, 'botania:gaia_ingot', 'hbm_m:schrabidium_powder'] * repeats])
                self.assertLessEqual(len(effective['ingredients']), 20)
                self.assertFalse(any('chaos' in x['item'] for x in extra))
        self.assertEqual(count, 28)

if __name__ == '__main__':
    unittest.main()
