"""Export the actual HBM production dependencies as a zoomable SVG preview."""
import json
from html import escape
from pathlib import Path
import textwrap


def export_graph(root):
    c=json.loads((root/'chapters/hbm_industry.snbt').read_text())
    nodes=[q for q in c['quests'] if q['id'].startswith('19')];by={q['id']:q for q in nodes}
    top=min(q['y'] for q in nodes)
    pos={q['id']:(60+q['x']/1.8*220,100+(q['y']-top)/1.8*140) for q in nodes}
    w=int(max(x for x,y in pos.values())+250);h=int(max(y for x,y in pos.values())+160)
    colors={'HBM: запуск':'#79b8ff','HBM: оснастка':'#f4bd73','HBM: компоненты':'#bd9df2','HBM: сборщик':'#82d7b0','HBM: эксплуатация':'#f397bc'}
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">', '<rect width="100%" height="100%" fill="#101724"/>','<defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#788aa6"/></marker></defs>', '<text x="60" y="35" fill="#eef3fb" font-family="sans-serif" font-size="25">HBM · 43 производственных задания · зависимости из книги</text>', '<text x="60" y="62" fill="#b0bfd4" font-family="sans-serif" font-size="16">Входы из прежних уроков и межглавные требования перечислены в описаниях. Общий этап V проверяется зависимостями.</text>']
    for q in nodes:
        x,y=pos[q['id']]
        for dep in q.get('dependencies',[]):
            if dep not in by:continue
            a,b=pos[dep];dx=x-a;dy=y-b
            border=min(90/abs(dx) if dx else float('inf'),43/abs(dy) if dy else float('inf'))
            out.append(f'<line x1="{a+90+dx*border}" y1="{b+43+dy*border}" x2="{x+90-dx*border}" y2="{y+43-dy*border}" stroke="#788aa6" stroke-opacity=".65" stroke-width="2" marker-end="url(#arrow)"/>')
    for q in nodes:
        x,y=pos[q['id']];branch,title=q['title'].split(' · ',1);color=colors[branch]
        out.append(f'<g><title>{escape(q["title"])}</title><rect x="{x}" y="{y}" width="180" height="86" rx="9" fill="#182437" stroke="{color}" stroke-width="2"/>')
        out.append(f'<text x="{x+10}" y="{y+19}" fill="{color}" font-family="sans-serif" font-size="11">{escape(branch)}</text>')
        for i,line in enumerate(textwrap.wrap(title,23)):
            out.append(f'<text x="{x+10}" y="{y+40+i*17}" fill="#eef3fb" font-family="sans-serif" font-size="13">{escape(line)}</text>')
        out.append('</g>')
    out.append('</svg>')
    (root.parents[3]/'docs/HBM-CONNECTIONS-0.19.svg').write_text('\n'.join(out)+'\n')
