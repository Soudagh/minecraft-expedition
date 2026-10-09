"""Player-facing progression contracts for converging production branches."""
import json
from pathlib import Path
import unittest
from core_quests import rows
from expanded_quests import META

ROOT=Path(__file__).resolve().parents[1]/'overrides/config/ftbquests/quests'

class ProductionConnections(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.chapters={p.stem:json.loads(p.read_text()) for p in (ROOT/'chapters').glob('*.snbt')}
        cls.quests={q['id']:q for c in cls.chapters.values() for q in c['quests']}
    def ancestors(self,qid):
        result=set();pending=list(self.quests[qid].get('dependencies',[]))
        while pending:
            d=pending.pop()
            if d in result:continue
            result.add(d);pending.extend(self.quests[d].get('dependencies',[]))
        return result
    def deep(self,key):return f'191100000000{key:04X}'
    def test_hbm_materials_and_independent_electronics(self):
        # Furnace construction must follow copper plates; press preparation
        # must remain possible before the first HBM steel batch.
        self.assertIn(self.deep(11),self.ancestors(self.deep(3)))
        self.assertNotIn(self.deep(4),self.ancestors(self.deep(9)))
        analog=self.ancestors(self.deep(33))
        for key in [17,20,21,22,31,32]:self.assertIn(self.deep(key),analog)
        self.assertNotIn(self.deep(26),analog)  # microchips are not analog inputs
        self.assertNotIn(self.deep(35),analog)
        for key in [26,31,32]:self.assertIn(self.deep(key),self.ancestors(self.deep(35)))
        for key in [34,35,37,29]:self.assertIn(self.deep(key),self.ancestors(self.deep(42)))
    def test_hbm_gates_and_visible_convergence(self):
        hbm=[q for q in self.chapters['hbm_industry']['quests'] if q['id'].startswith('19')]
        for q in hbm:self.assertIn('1400000000000005',self.ancestors(q['id']))
        self.assertFalse(self.quests[self.deep(33)]['hide_dependency_lines'])
        self.assertGreaterEqual(len(self.quests[self.deep(33)]['dependencies']),3)
    def test_removed_edges_remain_required_through_other_steps(self):
        report=json.loads((ROOT.parents[3]/'docs/QUEST-CONNECTIONS-0.19.json').read_text())
        for edge in report['redundantEdgesRemoved']:
            self.assertIn(edge['dependency'],self.ancestors(edge['quest']),edge)

    def test_rs_processor_types_are_independent(self):
        chapter=self.chapters['storage']['quests']
        def lesson(item):return next(q for q in chapter if q['id'].startswith('16') and any(t.get('item')==item for t in q['tasks']))
        for kind in ['basic','improved','advanced']:
            ready=lesson(f'refinedstorage:{kind}_processor');raw=lesson(f'refinedstorage:raw_{kind}_processor')
            self.assertIn(raw['id'],self.ancestors(ready['id']))
            for other in ['basic','improved','advanced']:
                if other!=kind:
                    self.assertNotIn(lesson(f'refinedstorage:{other}_processor')['id'],self.ancestors(ready['id']))
                    self.assertNotIn(lesson(f'refinedstorage:raw_{other}_processor')['id'],self.ancestors(ready['id']))
    def test_practice_has_its_described_workstation(self):
        for slug in META:
            selected=[r for r in rows() if r[0]==slug]
            for n,(_,anchor,*_) in enumerate(selected,1):
                qid=f'18{list(META).index(slug)+1:02X}00000000{n:04X}'
                candidates=[q for q in self.chapters[slug]['quests'] if not q['id'].startswith(('18','19')) and any(t.get('item')==anchor for t in q['tasks'])]
                if not candidates:continue # a documented cross-chapter anchor
                self.assertIn(candidates[-1]['id'],self.ancestors(qid),(slug,anchor))

if __name__=='__main__':unittest.main()
