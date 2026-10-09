execute unless score $expedition exp_b9 matches 1 run tellraw @a {"text": "[Экспедиция] Победа: Realmwarden. Она сохранена для всей экспедиции.", "color": "green"}
scoreboard players set $expedition exp_b9 1
function expedition:progression/sync
