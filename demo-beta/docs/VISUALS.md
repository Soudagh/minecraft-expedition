# Необязательная графика и первое лицо

Установщик 0.4 поддерживает два отдельных клиентских профиля. Версии и SHA-256 зафиксированы в `visuals.lock.json`; файлы загружаются с Modrinth. Серверу они не нужны. Базовые Better Combat, Combat Roll и Not Enough Animations уже включены.

## Первое лицо

`--visuals first-person` добавляет [First-person Model 2.7.3](https://modrinth.com/mod/first-person-model/version/kxFDUOmS). Он показывает тело и анимации от третьего лица в первом лице; сам новых движений не добавляет. Источник анимаций — уже установленный Not Enough Animations 1.12.6, боевые движения — Better Combat.

F6 переключает эффект (если клавишу не занял другой мод). Сначала проверьте меч, двуручное оружие, щит, лук, посох M&A и Hex, перекат, плавание и взгляд вниз. Есть [отчёт о пересечении Dynamic Mode и Better Combat](https://github.com/tr7zw/FirstPersonModel/issues/453); исправление именно в нашем наборе графически не подтверждено. Если руки мешают атакам, отключите эффект F6 и проверьте настройки Vanilla Hands. Epic Fight поверх Better Combat не добавлен.

## Шейдеры

`--visuals shaders` добавляет [Oculus 1.8.0](https://modrinth.com/mod/oculus/version/iQ1SwGc3) и [Complementary Reimagined r5.9.3](https://modrinth.com/shader/complementary-reimagined/version/Bqen1mJX). Требуемый Embeddium 0.3.31 уже есть. OptiFine и Rubidium устанавливать не нужно.

Откройте настройки графики → Shaders/Шейдеры, выберите Complementary. Начните с профиля Medium и сравните плавность боёв с выключенными шейдерами. Файл настроек пользователя установщик не заменяет; при новой установке принудительное включение не выполняется.

Create 6.0.8 использует Flywheel 1.0.5. Совместимость всей сцены ещё не подтверждена: есть [отчёт о сбое Frogport с Oculus на Apple Silicon](https://github.com/Creators-of-Create/Create/issues/10625). На Windows/NVIDIA результат может отличаться. Отдельно проверьте движущиеся конструкции, пакеты/Frogport, магические эффекты и боссов. Старый Iris/Flywheel Compat для прежнего Create не добавлен. Если возникает сбой, сперва воспроизведите его без профиля shaders в отдельной копии.

## Установка и удаление профилей

В Windows CMD, из распакованного bootstrap:

```bat
py tools/install.py --side client --from-instance "E:\Minecraft\Expedition-0.3.2" --stopped --destination "E:\Minecraft\Expedition-0.4" --visuals first-person shaders
```

Замените исходный путь на свой существующий экземпляр; целевой папки ещё не должно быть. Игра должна быть закрыта.

При последующем обновлении отсутствие аргумента `--visuals` сохраняет выбранные профили. `--visuals first-person` оставит только первое лицо; пустой `--visuals` уберёт оба из новой копии. Старый экземпляр не меняется. Эти профили не добавляют блоков/ресурсов мира; их можно различать между участниками команды.

Проверены метаданные зависимостей, содержимое JAR и хеши. Полный графический запуск и FPS с этими профилями ещё не проверены.
