"""Canonical, save-stable expedition stages and renewable processing batches."""
# stage, slug, boss title, resource name, ingredients (4 output items per batch)
STAGES = [
 (1,'watchers','Abyss Watchers','Закалённая основа',[('minecraft:iron_ingot',4),('minecraft:copper_ingot',4),('minecraft:coal',2)]),
 (2,'champion','Corrupted Champion','Очищенная связка',[('kubejs:material_watchers',4),('minecraft:redstone',4),('minecraft:quartz',4)]),
 (3,'lothric','Lothric','Рунический сплав',[('kubejs:material_champion',4),('botania:manasteel_ingot',4),('create:brass_ingot',4)]),
 (4,'sunflower','Curse-rotted Sunflower','Стабилизированное связующее',[('kubejs:material_lothric',4),('botania:rune_water',1),('botania:rune_fire',1),('botania:rune_earth',1),('botania:rune_air',1)]),
 (5,'annihilator','Relic Annihilator','Промышленный катализатор',[('kubejs:material_sunflower',4),('kubejs:attuned_core',1),('gtceu:steel_ingot',8)]),
 (6,'cinder','Soul of Cinder','Матрица развитого производства',[('kubejs:material_annihilator',4),('gtceu:aluminium_ingot',8),('gtceu:mv_electric_motor',1)]),
 (7,'nightlord','Nightlord','Матрица сборочной линии',[('kubejs:material_cinder',4),('gtceu:titanium_ingot',8),('gtceu:nano_processor',2)]),
 (8,'melkor','Melkor','Квантовая матрица',[('kubejs:material_nightlord',4),('gtceu:tungsten_steel_ingot',8),('gtceu:iv_electric_motor',1)]),
 (9,'realmwarden','Realmwarden','Матрица синтеза',[('kubejs:material_melkor',4),('gtceu:naquadah_alloy_ingot',8),('gtceu:luv_electric_motor',1)]),
]
# Final upstream callbacks only. Nested aw/soc functions in nl/te are not victories.
SLB_HOOKS = {
 'aw': ('watchers','aj.slb_aw.root'),
 'lothran': ('lothric','aj.lothran_boss_test_1.root'),
 'sunflower': ('sunflower','aj.gigant_sunflower.root'),
 'soc': ('cinder','aj.slb_soc.root'),
 'nl': ('nightlord','aj.slb_nl.root'),
 'te': ('melkor','aj.slb_te.root'),
}
HULL_STAGES = {'lv':'annihilator','mv':'annihilator','hv':'cinder','ev':'cinder',
               'iv':'nightlord','luv':'melkor','zpm':'realmwarden','uv':'realmwarden'}
