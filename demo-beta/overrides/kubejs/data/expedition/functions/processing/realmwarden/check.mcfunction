execute unless score $expedition exp_stage matches 9.. run tellraw @s {"text": "[Экспедиция] Нужен общий этап 9: Realmwarden. Материалы не потрачены.", "color": "gold"}
execute store result score @s exp_i0 run clear @s kubejs:material_melkor 0
execute store result score @s exp_i1 run clear @s gtceu:naquadah_alloy_ingot 0
execute store result score @s exp_i2 run clear @s gtceu:luv_electric_motor 0
scoreboard players set @s exp_batch 0
execute if score $expedition exp_stage matches 9.. if score @s exp_i0 matches 4.. if score @s exp_i1 matches 8.. if score @s exp_i2 matches 1.. run scoreboard players set @s exp_batch 1
execute if score $expedition exp_stage matches 9.. if score @s exp_batch matches 0 run tellraw @s {"text": "[Экспедиция] Не хватает материалов. Состав партии указан в подсказке схемы; ничего не потрачено.", "color": "gold"}
execute if score @s exp_batch matches 1 run function expedition:processing/realmwarden/commit
