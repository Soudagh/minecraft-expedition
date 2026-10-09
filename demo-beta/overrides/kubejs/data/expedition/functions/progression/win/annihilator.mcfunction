execute unless score $expedition exp_b5 matches 1 run tellraw @a {"text": "[Экспедиция] Победа: Relic Annihilator. Она сохранена для всей экспедиции.", "color": "green"}
scoreboard players set $expedition exp_b5 1
function expedition:progression/sync
