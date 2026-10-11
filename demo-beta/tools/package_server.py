"""Build a ready-to-run server ZIP using verified mods and an installed Forge runtime."""
import argparse
import json
from pathlib import Path
import re
import shutil
import tempfile
import zipfile

from install import install, digest

ROOT = Path(__file__).resolve().parents[1]


def build(runtime, output):
    lock = json.loads((ROOT / 'mods.lock.json').read_text(encoding='utf-8'))
    runtime = Path(runtime).resolve()
    forge_path = Path('libraries/net/minecraftforge/forge') / (lock['minecraft'] + '-' + lock['forge'])
    for platform in ('unix', 'win'):
        args = (runtime / forge_path / (platform + '_args.txt')).read_text(encoding='utf-8')
        if '--fml.forgeVersion ' + lock['forge'] not in args or '--fml.mcVersion ' + lock['minecraft'] not in args:
            raise ValueError('Forge runtime version mismatch')
        for relative in set(re.findall(r'libraries/[^\s:;]+\.jar', args)):
            if not (runtime / relative).is_file():
                raise ValueError('Missing runtime library: ' + relative)
    # Only library JARs and the two launcher argument files; no test worlds or state.
    libraries = sorted(p for p in (runtime / 'libraries').rglob('*')
                       if p.is_file() and (p.suffix == '.jar' or p in
                           [runtime / forge_path / 'unix_args.txt', runtime / forge_path / 'win_args.txt']))
    for library in libraries:
        if library.suffix == '.jar':
            with zipfile.ZipFile(library) as jar:
                bad = jar.testzip()
                if bad:
                    raise ValueError('Corrupt runtime library: ' + str(library) + ': ' + bad)
    output = Path(output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    name = 'expedition-' + lock['version'] + '-server'
    archive_path = output / (name + '.zip')
    with tempfile.TemporaryDirectory(prefix='expedition-server-build-') as temporary:
        server = Path(temporary) / name
        install(server, 'server')
        for library in libraries:
            target = server / library.relative_to(runtime)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(library, target)
        (server / 'user_jvm_args.txt').write_text('-Xms2G\n-Xmx8G\n', encoding='utf-8')
        (server / 'eula.txt').write_text('# Read https://aka.ms/MinecraftEULA and set true if you agree.\neula=false\n', encoding='utf-8')
        (server / 'server.properties').write_text(
            'difficulty=hard\nonline-mode=true\nserver-port=25565\nlevel-name=world\n'
            'motd=Expedition ' + lock['version'] + '\n', encoding='utf-8')
        sh = server / 'run.sh'
        sh.write_text('''#!/usr/bin/env sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if [ -n "${JAVA_HOME:-}" ]; then
    JAVA_BIN="$JAVA_HOME/bin/java"
else
    JAVA_BIN=java
fi
exec "$JAVA_BIN" @user_jvm_args.txt @FORGE_ARGS nogui "$@"
'''.replace('FORGE_ARGS', (forge_path / 'unix_args.txt').as_posix()), encoding='utf-8')
        sh.chmod(0o755)
        bat = r'''@echo off
cd /d "%~dp0"
set "JAVA_BIN=java"
if defined JAVA_HOME set "JAVA_BIN=%JAVA_HOME%\bin\java.exe"
"%JAVA_BIN%" @user_jvm_args.txt @FORGE_ARGS nogui %*
pause
'''.replace('FORGE_ARGS', (forge_path / 'win_args.txt').as_posix())
        (server / 'run.bat').write_bytes(bat.replace('\n', '\r\n').encode('utf-8'))
        readme = f'''Expedition {lock['version']} — готовый сервер
Minecraft {lock['minecraft']}, Forge {lock['forge']}, Java 17.

1. Распакуйте весь архив в новую папку. Внутри уже есть моды и Forge.
2. Установите 64-битную Java 17. Команда java -version должна показывать 17.
   Можно задать JAVA_HOME на каталог установленной Java 17.
3. Прочитайте https://aka.ms/MinecraftEULA. Если принимаете условия,
   измените eula=false на eula=true в файле eula.txt.
4. Windows: запустите run.bat. Linux/macOS: bash run.sh.
   Установщик Forge и Python не нужны, моды при запуске не скачиваются.
5. Дождитесь строки Done в консоли. Для выключения введите stop.

Память задаётся в user_jvm_args.txt: по умолчанию -Xms2G и -Xmx8G.
Не выделяйте Java всю оперативную память машины.
Для внешних подключений разрешите TCP 25565 в настройках сети сервера.
На игровом хостинге загрузите содержимое папки и используйте Java 17
с запуском run.sh либо командой из него (аргументы Forge обязательны).
Настройки сервера: server.properties. Сложность hard, online-mode=true.
При необходимости включите whitelist командами whitelist on / whitelist add НИК.
У всех игроков должна быть клиентская сборка той же версии {lock['version']}.
Создайте одну команду FTB Teams и пригласите игроков до начала квестов.
Мир создаётся при первом запуске; чужих миров и игроков в архиве нет.
Перед обновлением остановите сервер командой stop и сделайте резервную копию.
Это промежуточная версия сборки; полный игровой прогон ещё не завершён.

Состав и контрольные суммы: SERVER-FILES.sha256 и expedition-installed.json.
'''
        (server / 'START-HERE.txt').write_bytes(readme.encode('utf-8-sig'))
        shutil.copy2(ROOT / 'mods.lock.json', server / 'mods.lock.json')
        payload = sorted(p for p in server.rglob('*') if p.is_file())
        sums = ''.join(digest(p) + '  ' + p.relative_to(server).as_posix() + '\n' for p in payload)
        (server / 'SERVER-FILES.sha256').write_text(sums, encoding='utf-8')
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for path in sorted(p for p in server.rglob('*') if p.is_file()):
                archive.write(path, Path(name) / path.relative_to(server))
    with zipfile.ZipFile(archive_path) as archive:
        bad = archive.testzip()
        if bad:
            raise ValueError('Archive CRC failure: ' + bad)
    checksum = digest(archive_path)
    archive_path.with_suffix('.zip.sha256').write_text(checksum + '  ' + archive_path.name + '\n', encoding='utf-8')
    print('Archive:', archive_path)
    print('Size:', archive_path.stat().st_size)
    print('SHA-256:', checksum)
    return archive_path


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--forge-runtime', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist')
    args = parser.parse_args()
    build(args.forge_runtime, args.output)
