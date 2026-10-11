"""Regression: a GT gate must never discount HBM materials or change output/energy."""
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from build_industry_balance import ROOT, MACHINES, build


class IndustryBalanceContracts(unittest.TestCase):
    def test_each_machine_retains_native_costs_and_id(self):
        lock = json.loads((ROOT / 'mods.lock.json').read_text())
        mod = next(m for m in lock['mods'] if m['slug'] == 'hbms-nuclear-tech-modernized')
        jar = ROOT / '.cache/mods' / mod['filename']
        with zipfile.ZipFile(jar) as archive, tempfile.TemporaryDirectory() as tmp:
            report = build(jar, Path(tmp))
            for name, tier in MACHINES.items():
                native = json.loads(archive.read(f'data/hbm_m/recipes/{name}.json'))
                actual = json.loads((ROOT / f'overrides/kubejs/data/hbm_m/recipes/{name}.json').read_text())
                generated = report['recipes'][f'hbm_m:{name}']
                self.assertEqual(actual, generated)
                self.assertEqual(actual['ingredients'][:-1], native['ingredients'])
                self.assertEqual(actual['ingredients'][-1], {'count': 1, 'item': f'gtceu:{tier}_machine_hull'})
                self.assertLessEqual(len(actual['ingredients']), 12)
                actual['ingredients'] = actual['ingredients'][:-1]
                self.assertEqual(actual, native)

    def test_wrong_upstream_is_rejected_before_writes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            jar = root / 'wrong.jar'
            jar.write_bytes(b'wrong version')
            with self.assertRaisesRegex(ValueError, 'differs'):
                build(jar, root)
            self.assertFalse((root / 'overrides').exists())


if __name__ == '__main__':
    unittest.main()
