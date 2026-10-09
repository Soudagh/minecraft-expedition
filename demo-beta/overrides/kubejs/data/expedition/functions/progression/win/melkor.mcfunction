execute unless score $expedition exp_b8 matches 1 run tellraw @a {"text": "[Экспедиция] Победа: Melkor. Она сохранена для всей экспедиции.", "color": "green"}
scoreboard players set $expedition exp_b8 1
function expedition:progression/sync
