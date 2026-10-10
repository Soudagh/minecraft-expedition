"""Regression for the oversized FTB login packet and preserved lessons."""
import json
from pathlib import Path
import subprocess
import unittest
from quest_text_budget import description_bytes, TEXT_BUDGET
PACK=Path(__file__).resolve().parents[1]
BASE='d73fa812c8a5778c908c2e67f06452c39ba3a430'
class QuestTextBudgetTests(unittest.TestCase):
 def test_budget_and_historical_content(self):
  chapters={p.stem:json.loads(p.read_text()) for p in (PACK/'overrides/config/ftbquests/quests/chapters').glob('*.snbt')}
  self.assertLessEqual(description_bytes(chapters),TEXT_BUDGET)
  for slug,c in chapters.items():
   relative='demo-beta/overrides/config/ftbquests/quests/chapters/'+slug+'.snbt'
   old=json.loads(subprocess.check_output(['git','show',BASE+':'+relative],cwd=PACK.parent,text=True))
   before={q['id']:q for q in old['quests']}; after={q['id']:q for q in c['quests']}
   self.assertEqual(set(before),set(after))
   texts={p for q in c['quests'] for p in q['description']}
   for qid,q in before.items():
    for key in ('tasks','dependencies','title','icon','x','y'):
     self.assertEqual(q.get(key),after[qid].get(key),(qid,key))
    for paragraph in q['description']:
     if paragraph.startswith(('Зачёт:','Подготовка:')):continue
     self.assertTrue(paragraph in texts or 'Общие правила главы: '+paragraph in texts,(slug,qid,paragraph))
 def test_budget_report(self):
  report=json.loads((PACK/'docs/QUEST-TEXT-BUDGET-0.22.json').read_text())
  self.assertLess(report['afterDescriptionBytes'],report['beforeDescriptionBytes'])
  self.assertEqual(report['descriptionBudget'],TEXT_BUDGET)
  self.assertGreater(len(report['practiceReferences']),0)
  self.assertGreater(len(report['sharedRules']),0)
if __name__=='__main__':unittest.main()
