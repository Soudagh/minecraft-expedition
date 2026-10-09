execute unless score $expedition exp_b3 matches 1 run tellraw @a {"text": "[Экспедиция] Победа: Lothric. Она сохранена для всей экспедиции.", "color": "green"}
scoreboard players set $expedition exp_b3 1
function expedition:progression/sync
