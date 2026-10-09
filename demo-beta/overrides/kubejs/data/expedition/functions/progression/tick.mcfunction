scoreboard players add $expedition exp_timer 1
execute if score $expedition exp_timer matches 20.. run function expedition:progression/sync
execute if score $expedition exp_timer matches 20.. run scoreboard players set $expedition exp_timer 0
