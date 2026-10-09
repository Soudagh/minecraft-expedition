"""Book regression checks: readability, unchanged requirements and stable builds."""
import json
import math
from pathlib import Path
import subprocess
import tempfile
import unittest
from quest_layout import layout_book

ROOT=Path(__file__).resolve().parents[1]/'overrides/config/ftbquests/quests'

class QuestLayoutContracts(unittest.TestCase):
    def test_no_overlaps_or_lines_through_nodes(self):
        for path in (ROOT/'chapters').glob('*.snbt'):
            quests=json.loads(path.read_text())['quests'];by={q['id']:q for q in quests}
            with self.subTest(chapter=path.stem):
                self.assertEqual(len(quests),len({(q['x'],q['y']) for q in quests}))
                for q in quests:
                    for dep in q.get('dependencies',[]):
                        if dep not in by or q.get('hide_dependency_lines') or by[dep].get('hide_dependent_lines'):continue
                        a=by[dep];dx=q['x']-a['x'];dy=q['y']-a['y'];length=dx*dx+dy*dy
                        self.assertGreater(length,0)
                        for n in quests:
                            if n is a or n is q:continue
                            t=((n['x']-a['x'])*dx+(n['y']-a['y'])*dy)/length
                            if 0<t<1:self.assertGreaterEqual(math.hypot(n['x']-a['x']-t*dx,n['y']-a['y']-t*dy),.6-1e-8,(path.stem,a['title'],q['title'],n['title']))

    def test_layout_preserves_tasks_and_dependencies(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'chapters').mkdir()
            before={}
            for path in (ROOT/'chapters').glob('*.snbt'):
                (root/'chapters'/path.name).write_bytes(path.read_bytes())
                for q in json.loads(path.read_text())['quests']:before[q['id']]=(q['tasks'],q.get('dependencies',[]))
            layout_book(root)
            after={q['id']:(q['tasks'],q.get('dependencies',[])) for p in (root/'chapters').glob('*.snbt') for q in json.loads(p.read_text())['quests']}
            self.assertEqual(before,after)

    def test_rebuild_is_deterministic(self):
        pack=ROOT.parents[3]
        paths=list((ROOT/'chapters').glob('*.snbt'))+[pack/'docs/QUEST-CURRICULUM-0.19.json',pack/'docs/QUEST-LAYOUT-0.19.json',pack/'docs/QUEST-CONNECTIONS-0.19.json',pack/'docs/HBM-CONNECTIONS-0.19.svg']
        before={p:p.read_bytes() for p in paths}
        subprocess.run(['python3',str(pack/'tools/build_quests.py')],check=True,capture_output=True)
        self.assertEqual(before,{p:p.read_bytes() for p in paths})

if __name__=='__main__':unittest.main()
