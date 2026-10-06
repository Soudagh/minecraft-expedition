title @s times 20 120 30
title @s subtitle {"text":"Мир остаётся с вами. Экспедиция продолжается!","color":"yellow"}
title @s title {"text":"Демо завершено","color":"gold"}
tellraw @s {"text":"[Экспедиция] Команда прошла демо. Продолжайте строить и исследовать. Перед обновлением остановите сервер и сохраните копию всего экземпляра, включая мир и данные FTB Teams/Quests.","color":"green"}
execute at @s run playsound minecraft:ui.toast.challenge_complete master @s ~ ~ ~ 0.6 1
tag @s add exp_demo_seen_v1
