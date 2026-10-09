execute unless score $expedition exp_b2 matches 1 run tellraw @a {"text": "[Экспедиция] Победа: Corrupted Champion. Она сохранена для всей экспедиции.", "color": "green"}
scoreboard players set $expedition exp_b2 1
function expedition:progression/sync
