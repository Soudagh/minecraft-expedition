scoreboard objectives add exp_stage dummy
scoreboard objectives add exp_timer dummy
scoreboard objectives add exp_batch dummy
scoreboard objectives add exp_b1 dummy
scoreboard objectives add exp_b2 dummy
scoreboard objectives add exp_b3 dummy
scoreboard objectives add exp_b4 dummy
scoreboard objectives add exp_b5 dummy
scoreboard objectives add exp_b6 dummy
scoreboard objectives add exp_b7 dummy
scoreboard objectives add exp_b8 dummy
scoreboard objectives add exp_b9 dummy
scoreboard objectives add exp_i0 dummy
scoreboard objectives add exp_i1 dummy
scoreboard objectives add exp_i2 dummy
scoreboard objectives add exp_i3 dummy
scoreboard objectives add exp_i4 dummy
execute unless score $expedition exp_b1 matches 0.. run scoreboard players set $expedition exp_b1 0
execute unless score $expedition exp_b2 matches 0.. run scoreboard players set $expedition exp_b2 0
execute unless score $expedition exp_b3 matches 0.. run scoreboard players set $expedition exp_b3 0
execute unless score $expedition exp_b4 matches 0.. run scoreboard players set $expedition exp_b4 0
execute unless score $expedition exp_b5 matches 0.. run scoreboard players set $expedition exp_b5 0
execute unless score $expedition exp_b6 matches 0.. run scoreboard players set $expedition exp_b6 0
execute unless score $expedition exp_b7 matches 0.. run scoreboard players set $expedition exp_b7 0
execute unless score $expedition exp_b8 matches 0.. run scoreboard players set $expedition exp_b8 0
execute unless score $expedition exp_b9 matches 0.. run scoreboard players set $expedition exp_b9 0
execute unless score $expedition exp_stage matches 0.. run scoreboard players set $expedition exp_stage 0
scoreboard players set $expedition exp_timer 0
