"""Validate book references, persistent IDs and dependency cycles.

With --baseline-ref, also prove that historical task definitions survive intact.
Runtime registry/recipe verification is still required after this static check.
"""
import argparse
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1] / 'overrides/config/ftbquests/quests'

def validate(root, baseline_ref=None):
    ids, quests, tasks = set(), {}, {}
    chapters = sorted((root/'chapters').glob('*.snbt'))
    def register(value):
        if len(value) != 16 or any(c not in '0123456789ABCDEF' for c in value):
            raise ValueError(f'Invalid ID: {value}')
        if value in ids:
            raise ValueError(f'Duplicate ID: {value}')
        ids.add(value)
    for path in chapters:
        chapter=json.loads(path.read_text())
        register(chapter['id'])
        for q in chapter['quests']:
            register(q['id']); quests[q['id']]=q
            if not q.get('tasks'):
                raise ValueError(f'No tasks: {q["id"]}')
            for task in q['tasks']:
                register(task['id']); tasks[task['id']]=task
                if task['type']=='item' and (task.get('consume_items',True) or task.get('count',1)<1):
                    raise ValueError(f'Invalid item goal: {task["id"]}')
    visiting,done=set(),set()
    def visit(qid):
        if qid in visiting: raise ValueError(f'Cycle at {qid}')
        if qid in done: return
        if qid not in quests: raise ValueError(f'Missing dependency: {qid}')
        visiting.add(qid)
        for dep in quests[qid].get('dependencies',[]): visit(dep)
        visiting.remove(qid); done.add(qid)
    for qid in quests: visit(qid)
    if baseline_ref:
        repo=Path(__file__).resolve().parents[2]
        names=subprocess.check_output(['git','ls-tree','-r','--name-only',baseline_ref,'demo-beta/overrides/config/ftbquests/quests/chapters'],cwd=repo,text=True).splitlines()
        old_quests=old_tasks=0
        for name in names:
            old=json.loads(subprocess.check_output(['git','show',f'{baseline_ref}:{name}'],cwd=repo,text=True))
            for q in old['quests']:
                if q['id'] not in quests: raise ValueError(f'Lost quest: {q["id"]}')
                old_quests+=1
                for task in q['tasks']:
                    if tasks.get(task['id'])!=task: raise ValueError(f'Changed historical task: {task["id"]}')
                    old_tasks+=1
        print(f'Preserved {old_quests} historical quests / {old_tasks} task definitions')
    print(f'Validated {len(chapters)} chapters / {len(quests)} quests / {len(tasks)} tasks; dependencies acyclic')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--baseline-ref')
    args=parser.parse_args();validate(ROOT,args.baseline_ref)
