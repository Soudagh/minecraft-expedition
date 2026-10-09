import json
from pathlib import Path
import unittest
from hbm_structure import PHASES

ROOT=Path(__file__).resolve().parents[1]
class HbmStructure(unittest.TestCase):
    def test_single_kind_and_fixed_item_icons(self):
        for p in (ROOT/'overrides/config/ftbquests/quests/chapters').glob('*.snbt'):
            for q in json.loads(p.read_text())['quests']:
                types={t['type'] for t in q['tasks']}
                self.assertFalse({'item','checkmark'}<=types,q['id'])
                if types=={'item'}:self.assertEqual(q['icon'],q['tasks'][0]['item'])
    def test_split_preserves_required_practice(self):
        qs={q['id']:q for p in (ROOT/'overrides/config/ftbquests/quests/chapters').glob('*.snbt') for q in json.loads(p.read_text())['quests']}
        for r in json.loads((ROOT/'docs/QUEST-TASK-SPLITS-0.20.json').read_text()):
            item=qs[r['itemQuest']];practice=qs[r['practiceQuest']]
            self.assertEqual(practice['dependencies'],[item['id']])
            self.assertEqual({t['type'] for t in item['tasks']},{'item'})
            self.assertEqual({t['type'] for t in practice['tasks']},{'checkmark'})
            for q in qs.values():
                if q is not practice:self.assertNotIn(item['id'],q.get('dependencies',[]))
    def test_phase_order_and_unique_membership(self):
        chapters=[json.loads((ROOT/'overrides/config/ftbquests/quests/chapters'/f'{s}.snbt').read_text()) for s,_ in PHASES]
        orders=[c['order_index'] for c in chapters];self.assertEqual(orders,sorted(orders))
        self.assertEqual(len(set(orders)),5)
        for c in chapters:self.assertGreater(len(c['quests']),15)
if __name__=='__main__':unittest.main()
