execute unless score $expedition exp_cat matches 8.. run return 0
execute unless score $expedition exp_stage matches 0 run return 0
execute unless score $expedition exp_b1 matches 1 run tellraw @a {"text": "[Экспедиция] Победа: Abyss Watchers. Она сохранена для всей экспедиции.", "color": "green"}
scoreboard players set $expedition exp_b1 1
function expedition:progression/sync
