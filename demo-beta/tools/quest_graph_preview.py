"""Export HBM phase maps from the generated book."""
import json
from html import escape
import textwrap
from hbm_structure import PHASES

def export_graph(root):
    panels=[];offset=100;width=1000
    for slug,title in PHASES:
        c=json.loads((root/'chapters'/f'{slug}.snbt').read_text());nodes=c['quests'];by={q['id']:q for q in nodes}
        x0=min(q['x'] for q in nodes);y0=min(q['y'] for q in nodes)
        pos={q['id']:(50+(q['x']-x0)*140,offset+70+(q['y']-y0)*100) for q in nodes}
        panels.append(f'<text x="50" y="{offset+30}" fill="#82d7b0" font-family="sans-serif" font-size="25">{escape(title)}</text>')
        for q in nodes:
            x,y=pos[q['id']]
            for dep in q.get('dependencies',[]):
                if dep not in by or q.get('hide_dependency_lines') or by[dep].get('hide_dependent_lines'):continue
                a,b=pos[dep];dx=x-a;dy=y-b;border=min(95/abs(dx) if dx else float('inf'),45/abs(dy) if dy else float('inf'))
                panels.append(f'<line x1="{a+95+dx*border}" y1="{b+45+dy*border}" x2="{x+95-dx*border}" y2="{y+45-dy*border}" stroke="#788aa6" stroke-width="2" marker-end="url(#arrow)"/>')
        for q in nodes:
            x,y=pos[q['id']];kind='Предметы' if q['tasks'][0]['type']=='item' else 'Практика';color='#f4bd73' if kind=='Предметы' else '#82d7b0'
            panels.append(f'<g><title>{escape(q["title"])}</title><rect x="{x}" y="{y}" width="190" height="90" rx="8" fill="#182437" stroke="{color}"/><text x="{x+10}" y="{y+19}" fill="{color}" font-family="sans-serif" font-size="11">{kind}</text>')
            text=q['title'].split(' · ',1)[-1].removesuffix(' · Практика')
            lines=textwrap.wrap(text,24)
            for i,line in enumerate(lines[:3]):panels.append(f'<text x="{x+10}" y="{y+40+i*17}" fill="#eef3fb" font-family="sans-serif" font-size="13">{escape(line)}</text>')
            panels.append('</g>')
        width=max(width,int(max(x for x,y in pos.values())+270));offset=int(max(y for x,y in pos.values())+160)
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {offset}" width="{width}" height="{offset}">','<rect width="100%" height="100%" fill="#101724"/>','<defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#788aa6"/></marker></defs>','<text x="50" y="35" fill="#eef3fb" font-family="sans-serif" font-size="25">HBM · двенадцать глав · предметы и практика отдельно</text>','<text x="50" y="65" fill="#b0bfd4" font-family="sans-serif" font-size="16">Межглавная подготовка указана в описаниях; стрелки внутри каждой главы следуют реальным зависимостям.</text>']+panels+['</svg>']
    (root.parents[3]/'docs/HBM-CONNECTIONS-0.22.svg').write_text('\n'.join(out)+'\n')
