execute if score $expedition exp_stage matches 0 if score $expedition exp_b1 matches 1 run function expedition:progression/open/watchers
execute if score $expedition exp_stage matches 1.. as @a[advancements={expedition:stages/watchers=false}] run advancement grant @s only expedition:stages/watchers
execute if score $expedition exp_stage matches 1 if score $expedition exp_b2 matches 1 run function expedition:progression/open/champion
execute if score $expedition exp_stage matches 2.. as @a[advancements={expedition:stages/champion=false}] run advancement grant @s only expedition:stages/champion
execute if score $expedition exp_stage matches 2 if score $expedition exp_b3 matches 1 run function expedition:progression/open/lothric
execute if score $expedition exp_stage matches 3.. as @a[advancements={expedition:stages/lothric=false}] run advancement grant @s only expedition:stages/lothric
execute if score $expedition exp_stage matches 3 if score $expedition exp_b4 matches 1 run function expedition:progression/open/sunflower
execute if score $expedition exp_stage matches 4.. as @a[advancements={expedition:stages/sunflower=false}] run advancement grant @s only expedition:stages/sunflower
execute if score $expedition exp_stage matches 4 if score $expedition exp_b5 matches 1 run function expedition:progression/open/annihilator
execute if score $expedition exp_stage matches 5.. as @a[advancements={expedition:stages/annihilator=false}] run advancement grant @s only expedition:stages/annihilator
execute if score $expedition exp_stage matches 5 if score $expedition exp_b6 matches 1 run function expedition:progression/open/cinder
execute if score $expedition exp_stage matches 6.. as @a[advancements={expedition:stages/cinder=false}] run advancement grant @s only expedition:stages/cinder
execute if score $expedition exp_stage matches 6 if score $expedition exp_b7 matches 1 run function expedition:progression/open/nightlord
execute if score $expedition exp_stage matches 7.. as @a[advancements={expedition:stages/nightlord=false}] run advancement grant @s only expedition:stages/nightlord
execute if score $expedition exp_stage matches 7 if score $expedition exp_b8 matches 1 run function expedition:progression/open/melkor
execute if score $expedition exp_stage matches 8.. as @a[advancements={expedition:stages/melkor=false}] run advancement grant @s only expedition:stages/melkor
execute if score $expedition exp_stage matches 8 if score $expedition exp_b9 matches 1 run function expedition:progression/open/realmwarden
execute if score $expedition exp_stage matches 9.. as @a[advancements={expedition:stages/realmwarden=false}] run advancement grant @s only expedition:stages/realmwarden
