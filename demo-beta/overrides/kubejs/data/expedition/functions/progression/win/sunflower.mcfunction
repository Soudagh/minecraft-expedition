execute unless score $expedition exp_b4 matches 1 run tellraw @a {"text": "[Экспедиция] Победа: Curse-rotted Sunflower. Она сохранена для всей экспедиции.", "color": "green"}
scoreboard players set $expedition exp_b4 1
function expedition:progression/sync
