"""Generate SNBT (JSON subset) with immutable quest/task identifiers."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / 'overrides/config/ftbquests/quests'
def qid(n): return f'100000000000{n:04X}'
def tid(n): return f'200000000000{n:04X}'
rows = [
 (1, 'Экспедиция начинается', 'minecraft:crafting_table', [], 0, 0, 'Создайте одну команду FTB Teams и пригласите всех четверых до начала квестов. Демо имеет общий финал для сервера.'),
 (2, 'Дом для команды', 'minecraft:stonecutter', [1], 2, -2, 'Chipped и FramedBlocks доступны с начала. Украшайте общую базу; мощное снаряжение за квесты не выдаётся.'),
 (3, 'Первые механизмы', 'create:andesite_alloy', [1], 2, 0, 'Соберите андезитовый сплав и организуйте рабочую площадку Create.'),
 (4, 'Сила воды', 'create:water_wheel', [3], 4, 0, 'Подключите колесо к валам. Квест проверяет предмет; работоспособность линии проверяйте сами.'),
 (5, 'Прессовая линия', 'create:mechanical_press', [4], 6, 0, 'Автоматизируйте изготовление листов.'),
 (6, 'Латунь', 'create:brass_ingot', [5], 8, 0, 'Для латуни потребуется нагретый смеситель. Подготовьте поход в Нижний мир.'),
 (7, 'Точное производство', 'create:precision_mechanism', [6], 10, 0, 'Постройте повторяемую цепочку последовательной сборки.'),
 (8, 'Механическое ядро', 'kubejs:mechanical_core', [7], 12, 0, 'Ядро связывает механику и магическое производство.'),
 (9, 'Живой камень', 'botania:livingrock', [1], 2, 2, 'Начните Botania с чистой маргаритки. Справочник доступен через Lexica Botania.'),
 (10, 'Запас маны', 'botania:mana_pool', [9], 4, 2, 'Организуйте генерацию и передачу маны. Одного бассейна для следующего шага недостаточно.'),
 (11, 'Рунический алтарь', 'botania:runic_altar', [10], 6, 2, 'Освойте руны четырёх стихий.'),
 (12, 'Настроенное ядро', 'kubejs:attuned_core', [8,11], 14, 1, 'Соедините руны, ману и механическое ядро.'),
 (13, 'Подготовка к бою', 'minecraft:shield', [1], 4, -2, 'Подготовьте броню, еду, оружие и заклинания. Better Combat и Combat Roll требуют выбора дистанции и момента уклонения.'),
 (14, 'Испытание команды', 'irons_spellbooks:dead_king', [13,12], 16, -1, 'Победите Мёртвого короля после подготовки производства. Это предварительный босс демо: сложность ещё нужно проверить вчетвером.'),
 (15, 'Первое электричество', 'gtceu:lv_steam_turbine', [12], 16, 2, 'Пройдите паровую подготовку GregTech. Соберите турбину LV и обеспечьте устойчивую подачу пара.'),
 (16, 'Финал демо', 'gtceu:lv_macerator', [14,15], 18, 1, 'Соберите электрический измельчитель LV. Финал откроется после боевого испытания и турбины. Мир не сбрасывается; дальнейшие главы появятся в обновлениях.')
]
quests=[]
for n,title,item,deps,x,y,description in rows:
    task={'id':tid(n),'type':'kill','entity':item,'value':1} if n==14 else {'id':tid(n),'type':'item','item':item,'count':1,'consume_items':False}
    quests.append({'id':qid(n),'title':title,'description':[description], 'x':float(x),'y':float(y),
                   'dependencies':[qid(d) for d in deps], 'tasks':[task]})
ROOT.mkdir(parents=True,exist_ok=True)
(ROOT/'chapters').mkdir(exist_ok=True)
for name,data in {
 'data.snbt':{'version':13,'title':'Экспедиция • демо 0.1','default_consume_items':False,
              'default_reward_team':True,'default_autoclaim_rewards':'disabled','progression_mode':'linear'},
 'chapter_groups.snbt':{'chapter_groups':[]},
 'chapters/demo.snbt':{'id':'3000000000000001','filename':'demo','title':'От мастерской к электричеству',
                      'order_index':0,'quests':quests}
}.items():
 (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
