"""Generate SNBT (JSON subset) with immutable quest/task identifiers."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / 'overrides/config/ftbquests/quests'
def qid(n): return f'100000000000{n:04X}'
def tid(n): return f'200000000000{n:04X}'
rows = [
 (1, 'Экспедиция начинается', 'minecraft:crafting_table', [], 0, 0, 'Создайте одну команду FTB Teams и пригласите всех четверых до начала квестов. Книга охватывает всю сборку: экспедиции, магию и индустрию до UV. Девять общих боссовых открытий находятся в главе основного маршрута.'),
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
 (13, 'Подготовка к бою', 'minecraft:shield', [1], 4, -2, 'Подготовьте броню, еду, оружие и заклинания. В боевой версии 0.6 включите режим боя Epic Fight через настройки управления. Combat Roll сохранён ради прежних зачарований; взаимодействие уклонений ещё проверяется. Для показа Sword Soaring на отдельном творческом мире возьмите Vatansever, включите F5 и изучите подсказку Shift.'),
 (14, 'Архив · испытание Cataclysm', 'cataclysm:netherite_monstrosity', [13], 16, -1, 'Необязательное испытание старого прототипа. Сохранено вместе с прогрессом прежних версий. В новый основной маршрут входит девять других боссов — см. атлас. Эта победа не засчитывается за них.'),
 (15, 'Первое электричество', 'gtceu:lv_steam_turbine', [12], 16, 2, 'Пройдите паровую подготовку GregTech. Соберите турбину LV и обеспечьте устойчивую подачу пара.'),
 (16, 'Архив · рубеж старого демо', 'gtceu:lv_macerator', [14,15], 18, 1, 'Сохранён технический финал ранних версий: Cataclysm и турбина LV. Он не завершает новый маршрут сборки. Старый прогресс и однократное уведомление сохранены; новые направления находятся в отдельных главах.'),
 (17, 'Путь мага: Mana and Artifice', 'mna:occulus', [1], 2, 4, 'Создайте Occulus и следуйте его ступеням развития. Изучайте заклинания, ритуалы и фракции. Собственное развитие школы сохраняется. Общие этапы дополнительно ограничивают tier 3 / 4 / 5 на III / VI / VII; Soar, Eldrin Flight и Blink — VII, Icarian Flight — не ранее IV.'),
 (18, 'Книга заклинаний', 'mna:spell_book', [17], 5, 4, 'Создайте книгу заклинаний Mana and Artifice. Практикуйте магию в экспедициях; этот квест проверяет предмет, а не боевое мастерство.'),
 (19, 'Путь исследователя: Hex Casting', 'hexcasting:staff/oak', [1], 2, 6, 'Создайте дубовый посох и откройте справочник Hex Casting. Изучайте паттерны, начиная с простых действий. Это отдельная специализация, не обязательное продолжение Mana and Artifice.'),
 (20, 'Записи паттернов', 'hexcasting:spellbook', [19], 5, 6, 'Поздняя необязательная цель: создайте книгу Hex Casting для хранения записей. В обычном рецепте нужен плод хоруса; для первых заклинаний книга не требуется. Полёт, Blink, Greater Teleport, Greater Sentinel и Flay Mind требуют VII; взрывы и молния — VI. Ручная добыча доступна с начала, добыча в кругах — с VI. Штатные расходы среды сохраняются.')
]
quests=[]
for n,title,item,deps,x,y,description in rows:
    task={'id':tid(n),'type':'kill','entity':item,'value':1} if n==14 else {'id':tid(n),'type':'item','item':item,'count':1,'consume_items':False}
    quests.append({'id':qid(n),'title':title,'description':[description], 'x':float(x),'y':float(y),
                   'dependencies':[qid(d) for d in deps], 'tasks':[task]})
ROOT.mkdir(parents=True,exist_ok=True)
(ROOT/'chapters').mkdir(exist_ok=True)
for name,data in {
 'data.snbt':{'version':13,'title':'Экспедиция • полная прогрессия','default_consume_items':False,
              'default_reward_team':True,'default_autoclaim_rewards':'disabled','progression_mode':'linear'},
 'chapter_groups.snbt':{'chapter_groups':[]},
 'chapters/demo.snbt':{'id':'3000000000000001','filename':'demo','title':'Пролог · основы экспедиции',
                      'order_index':0,'quests':quests}
}.items():
 (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Read-only planning cards: checkmarks acknowledge reading, never unlock recipes
# or stand in for a recorded boss kill. Existing demo quest IDs remain unchanged.
cards = [
 ('Маршрут 9 + 2: как пользоваться', 'Это атлас для тестирования. Галочка означает только «прочитано», не победу. Порядок — проект будущего баланса. Девять основных боссов установлены, два финальных мода пока отложены. Доступ и трофеи ещё не связаны с общей командной прогрессией.'),
 ('1 · Abyss Watchers', 'Souls like Bosses. Катакомбы Картуса: /locate structure souls_like_bosses:catacombs_of_carthus. Цель настройки: первая подготовленная экспедиция с оружием, защитой и расходниками. Награды планируем связать с кузницей трофеев и ранней магией.'),
 ('2 · Corrupted Champion', 'The Graveyard. Найдите части посоха в руинах и Lich Prison, проведите ритуал. Бой включает заклинания, охоту в темноте и деформацию. План подготовки: мобильность, лечение, контроль прислужников. Сущность graveyard:lich; голый summon не заменяет ритуал.'),
 ('3 · Lothric', 'Souls like Bosses. /locate structure souls_like_bosses:lothric_castle. План: усиленная RPG-экипировка и развитие выбранной магической специализации. Точные сопротивления и тактику предстоит проверить. Встроенный режим последовательности связывает доступ с Abyss Watchers.'),
 ('4 · Curse-rotted Sunflower', 'Souls like Bosses. /locate structure souls_like_bosses:curse_rotten_sunflower. Предварительное место до промышленного перехода; сложность и условия боя ещё проверяются. Планируем отдельную специализацию наград вместо обязательной замены всей брони.'),
 ('5 · Relic Annihilator', 'EEEAB’s Mobs. Сущность eeeabsmobs:relic_annihilator. Ядро открывается во время ракетных/лазерных атак — возможность оглушения. План: трофей открывает обработку переходных материалов Create → GregTech и равноценные магические рецепты.'),
 ('6 · Soul of Cinder', 'Полный Souls like Bosses, отдельный Standalone не требуется. /locate structure souls_like_bosses:kiln_of_the_first_flame. План: проверка развитой RPG-экипировки после начала промышленности. NanoMuscle не обещается на первом LV; магический путь остаётся самостоятельным.'),
 ('7 · Nightlord', 'Souls like Bosses. /locate structure souls_like_bosses:tree_of_light. Встроенная последовательность использует transposed_all_souls; не выдавайте себе эту метку ради обычного прохождения. План: поздние комплекты, стабильное снабжение и командная подготовка.'),
 ('8 · Melkor', 'Souls like Bosses. /locate structure souls_like_bosses:melkors_keep. План: поздняя экспедиция в Нижний мир и проверка устойчивости команды. Снаряжение из самого босса не требуется для его первого убийства.'),
 ('9 · Realmwarden', 'EEEAB’s Mobs. Сущность eeeabsmobs:realm_warden. Кандидат на завершение основной линии. Это новая версия стража, не старый Nameless Guardian. План: открыть подготовку к двум финальным испытаниям. Место относительно Melkor и Nightlord уточним после боёв.'),
 ('Отложенный финал · Chaos Guardian', 'Draconic Evolution пока НЕ установлен. Планируется боевой финал после основной линии. Сильное снаряжение, полёт и щиты не должны заранее обесценить предыдущие бои.'),
 ('Отложенный финал · Wither Storm', 'Cracker’s Wither Storm пока НЕ установлен. Планируется отдельная заключительная операция. Порядок относительно Chaos Guardian проверим; обычное удаление от базы не гарантирует сохранность мира. Первый тест — только на отдельной копии.')
]
atlas = []
for i, (title, description) in enumerate(cards):
    atlas.append({'id': f'110000000000{i:04X}', 'title': title,
                  'description': [description], 'x': float(i % 4 * 4), 'y': float(i // 4 * 3),
                  'tasks': [{'id': f'210000000000{i:04X}', 'type': 'checkmark', 'title': 'Прочитано (не победа)'}]})
(ROOT/'chapters/boss_atlas.snbt').write_text(json.dumps({
    'id': '3000000000000002', 'filename': 'boss_atlas', 'title': 'Атлас боссов · план и тестирование',
    'order_index': 20, 'quests': atlas}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

from quest_branches import write_branches
write_branches(ROOT, json)

from full_quests import write_full_book
write_full_book(ROOT, json)

from build_progression import build as build_progression
build_progression()

from equipment_quests import write_equipment
write_equipment(ROOT, json)

from expanded_quests import write_expanded
curriculum_summary=write_expanded(ROOT)
print('Expanded curriculum:',sum(row['added'] for row in curriculum_summary),'new quests')
from core_quests import write_core
core_summary=write_core(ROOT)
print('Core projects:',sum(row['added'] for row in core_summary),'new quests')
from deep_quests import write_deep
deep_summary=write_deep(ROOT)
print('Deep production chains:',sum(row['added'] for row in deep_summary),'new quests')
from quest_connections import connect_book
connect_book(ROOT)
from quest_layout import layout_book
layout_summary=layout_book(ROOT)
(ROOT.parents[3]/'docs/QUEST-LAYOUT-0.19.json').write_text(json.dumps(layout_summary,ensure_ascii=False,indent=2)+'\n')
from quest_graph_preview import export_graph
export_graph(ROOT)
from expanded_quests import write_report
write_report(ROOT)
