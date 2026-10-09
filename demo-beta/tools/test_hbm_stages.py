"""Completion, honest workshop scope, stage gates and cited material balance."""
import json
import unittest
from pathlib import Path
from hbm_stages import rows,quest_id
from hbm_structure import PHASES
ROOT=Path(__file__).resolve().parents[1]

class HbmStages(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=rows()
        cls.quests={q['id']:q for p in (ROOT/'overrides/config/ftbquests/quests/chapters').glob('*.snbt') for q in json.loads(p.read_text())['quests']}
    def ancestors(self,qid):
        found=set();pending=list(self.quests[qid].get('dependencies',[]))
        while pending:
            d=pending.pop()
            if d in found:continue
            found.add(d);pending.extend(self.quests[d].get('dependencies',[]))
        return found
    def test_all_phases_have_new_curriculum(self):
        self.assertEqual({int(r['phase']) for r in self.rows},set(range(len(PHASES))))
        self.assertEqual(len(self.rows),len({r['key'] for r in self.rows}))
    def test_dependencies_require_practice_and_stage(self):
        by={r['key']:r for r in self.rows}
        for r in self.rows:
            q=self.quests[quest_id(r['key'])]
            self.assertIn(f'140000000000{int(r["stage"]):04X}',self.ancestors(q['id']))
            for ref in r['requires'].split(';'):
                if ref.startswith('d:'):continue
                dep=by[ref];completion=quest_id(ref,dep['goals']!='~')
                self.assertIn(completion,q['dependencies'])
            if r['goals']!='~':
                self.assertEqual(self.quests[quest_id(r['key'],True)]['dependencies'],[q['id']])
    def test_survival_does_not_require_creative_workshop(self):
        workshops={quest_id(r['key']) for r in self.rows if r['mode']!='production'}
        for r in self.rows:
            q=self.quests[quest_id(r['key'])]
            if r['mode']=='production':self.assertFalse(self.ancestors(q['id'])&workshops)
            else:
                self.assertEqual({t['type'] for t in q['tasks']},{'checkmark'})
                self.assertTrue(any(p.startswith(('Учебный стенд:','Исследование:')) for p in q['description']))
    def test_every_cited_recipe_has_exact_locked_source(self):
        source=json.loads((ROOT/'docs/HBM-QUEST-SOURCES-0.21.json').read_text())['recipes']
        for r in self.rows:
            if r['recipes']!='~':
                for recipe in r['recipes'].split(';'):self.assertIn(recipe,source)
        billet=source['crafting/billet_uranium_fuel_compress']
        self.assertEqual(sum(line.count('#') for line in billet['pattern']),6)
        self.assertEqual(source['crafting/nugget_uranium_fuel_decompress']['result']['count'],6)
if __name__=='__main__':unittest.main()
