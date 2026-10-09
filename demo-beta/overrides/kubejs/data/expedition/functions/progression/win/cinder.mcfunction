execute unless score $expedition exp_b6 matches 1 run tellraw @a {"text": "[Экспедиция] Победа: Soul of Cinder. Она сохранена для всей экспедиции.", "color": "green"}
scoreboard players set $expedition exp_b6 1
function expedition:progression/sync
