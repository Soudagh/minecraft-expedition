execute unless score $expedition exp_b7 matches 1 run tellraw @a {"text": "[Экспедиция] Победа: Nightlord. Она сохранена для всей экспедиции.", "color": "green"}
scoreboard players set $expedition exp_b7 1
function expedition:progression/sync
