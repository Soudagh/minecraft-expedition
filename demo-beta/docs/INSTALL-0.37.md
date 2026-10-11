# Установка Экспедиции 0.37

Minecraft 1.20.1, Forge 47.4.10, Java 17. Версия 0.37.0-late-project-balance-dev.

## Клиент

Распакуйте bootstrap ZIP полностью. В папке `expedition-demo` откройте терминал. Нужен Python 3.10 или новее.

Windows:

```powershell
py tools/install.py --side client --destination "D:\Minecraft\Expedition-0.37"
```

Linux/macOS:

```sh
python3 tools/install.py --side client --destination "$HOME/Games/Expedition-0.37"
```

Выберите новую свободную папку. Дождитесь `Prepared:`: установщик скачает моды и проверит SHA-256. Установите в лаунчере Minecraft 1.20.1 с Forge 47.4.10, укажите Java 17 и подготовленную папку как каталог игры. Выделите 6–8 ГБ памяти. Для настройки Legacy см. `docs/INSTALL-LEGACY-WINDOWS.md`: пути и ссылки версии 0.22 в той исторической инструкции заменяйте на текущую 0.37.

## Сервер

Скачайте готовый серверный ZIP из релиза 0.37:
https://github.com/Soudagh/minecraft-expedition/releases/tag/v0.37.0-late-project-balance-dev

В серверном архиве уже есть Forge, моды и конфиги. Распакуйте в новую папку, используйте Java 17. Прочитайте EULA и при согласии измените `eula=false` на `eula=true`. Запуск: `run.bat` на Windows или `bash run.sh` на Linux/macOS. Память — в `user_jvm_args.txt`; подробности — в `START-HERE.txt` серверного архива. Для штатной остановки введите `stop` в консоли.

## Обновление

Остановите игру и сервер, сделайте резервную копию экземпляра. Из нового bootstrap можно перенести существующий экземпляр в новую папку:

```powershell
py tools/install.py --side client --from-instance "D:\Minecraft\Expedition-old" --stopped --destination "D:\Minecraft\Expedition-0.37"
```

Для сервера используйте `--side server`, затем установите соответствующий Forge либо перенесите runtime из готового серверного архива. Сохраните мир, данные команды, `server.properties`, whitelist и права операторов. Обе стороны обновляются целиком; `/reload` и патч только квестов не подходят. Новые структуры и руды появляются в новых чанках.

Схема сохранений 4. Это предварительный релиз: полный игровой прогон командой и положительная проверка собранного UV-реактора ещё не завершены.
