"""Install a locked pack, or copy a STOPPED instance before upgrading it.

Requires Python 3.10+. Never writes to an existing destination.
"""
import argparse
import hashlib
import json
import shutil
import ssl
import urllib.error
import urllib.request
from pathlib import Path
from compat import boss_overrides

ROOT = Path(__file__).resolve().parents[1]


def download_context():
    # Native verification can retrieve missing intermediate certificates on Windows.
    # Optional: the bootstrap still works with standard Python alone.
    try:
        import truststore
    except ImportError:
        return ssl.create_default_context()
    return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)


def download_verified(entry, target):
    request = urllib.request.Request(entry['url'], headers={'User-Agent': 'ExpeditionDemo/0.9.0'})
    part = target.with_suffix('.part')
    print('Downloading:', entry['url'], flush=True)
    try:
        with urllib.request.urlopen(request, timeout=180, context=download_context()) as response, part.open('wb') as output:
            shutil.copyfileobj(response, output)
        if digest(part) != entry['hashes']['sha256']:
            raise ValueError('Download hash mismatch: ' + target.name)
        part.replace(target)
    except (urllib.error.URLError, ssl.SSLCertVerificationError) as exc:
        reason = getattr(exc, 'reason', exc)
        if isinstance(reason, ssl.SSLCertVerificationError):
            raise ValueError(
                'HTTPS certificate verification failed for ' + entry['url'] + '\n'
                'Try: py -m pip install --upgrade truststore\n'
                'Then rerun the same install command. HTTPS verification stays enabled.\n'
                'If it still fails, send this URL and error; check Windows updates, '
                'system clock and HTTPS inspection by your network/security software.\n'
                'Original error: ' + str(reason)) from exc
        raise
    finally:
        if part.exists():
            part.unlink()


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def safe_relative(name):
    path = Path(name)
    if path.is_absolute() or '..' in path.parts or '\\' in name or ':' in name:
        raise ValueError('Unsafe relative path: ' + name)
    return path


def install(destination, side, source=None, stopped=False, cache=None, visuals=None):
    destination = Path(destination).resolve()
    if destination.exists():
        raise ValueError('Destination must not exist. Use a NEW directory.')
    if destination == ROOT or ROOT in destination.parents:
        raise ValueError('Choose an instance directory outside the pack source.')
    old = None
    if source:
        source = Path(source).resolve()
        if not stopped:
            raise ValueError('Stop Minecraft and the server, then pass --stopped.')
        if destination == source or source in destination.parents or destination in source.parents:
            raise ValueError('Source and destination must be separate directories.')
        if any(p.is_symlink() for p in source.rglob('*')):
            raise ValueError('Symlinks in the old instance are unsupported; original was not changed.')
        old = json.loads((source / 'expedition-installed.json').read_text(encoding='utf-8'))
        if old['side'] != side:
            raise ValueError('Cannot change client/server side during an upgrade.')
        # Do not silently overwrite local edits to pack-owned files.
        for name, expected in old['files'].items():
            p = source / safe_relative(name)
            if p.exists() and digest(p) != expected:
                raise ValueError('Locally changed managed file; merge manually first: ' + name)
    lock = json.loads((ROOT / 'mods.lock.json').read_text(encoding='utf-8'))
    if old and old.get('save_schema', 1) != lock.get('save_schema', 1):
        raise ValueError('This release changes the world format/mod set. Automatic migration is blocked. Keep the old instance and install a NEW test world; see release notes.')
    entries = [m for m in lock['mods'] if side == 'client' or m['side'] != 'client']
    visuals = sorted(set(visuals if visuals is not None else (old or {}).get('visuals', [])))
    if 'first-person' in visuals and any(e.get('slug') == 'epic-fight' for e in entries):
        visuals.remove('first-person')
        print('Epic Fight provides the combat renderer; First-person Model profile is omitted.')
    if any(v not in ('first-person', 'shaders') for v in visuals):
        raise ValueError('Unknown visual profile')
    if visuals and side != 'client':
        raise ValueError('Visual profiles are client-only')
    extras = []
    if visuals:
        visual_lock = json.loads((ROOT / 'visuals.lock.json').read_text(encoding='utf-8'))
        extras = [m for m in visual_lock['files'] if m['profile'] in visuals]
    cache = Path(cache) if cache else ROOT / '.cache' / 'mods'
    cache.mkdir(parents=True, exist_ok=True)
    # Download everything before copying or creating the instance.
    for entry in entries + extras:
        name = safe_relative(entry['filename'])
        if len(name.parts) != 1:
            raise ValueError('Invalid mod filename')
        target = cache / name
        if not target.exists() or digest(target) != entry['hashes']['sha256']:
            download_verified(entry, target)
        print('Verified:', name, flush=True)
    generated = boss_overrides(entries, cache)
    if source:
        shutil.copytree(source, destination)
        for name in old['files']:
            p = destination / safe_relative(name)
            if p.exists():
                p.unlink()
    else:
        destination.mkdir(parents=True)
    managed = {}
    def put(src, relative):
        target = destination / relative
        if target.exists():
            raise ValueError('Unmanaged file collision; original instance is intact: ' + str(relative))
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, target)
        managed[str(relative).replace('\\', '/')] = digest(target)
    for entry in entries:
        put(cache / entry['filename'], Path('mods') / entry['filename'])
    for entry in extras:
        if entry['directory'] not in ('mods', 'shaderpacks'):
            raise ValueError('Invalid visual asset directory')
        put(cache / entry['filename'], Path(entry['directory']) / entry['filename'])
    for src in sorted((ROOT / 'overrides').rglob('*')):
        if src.is_file():
            put(src, src.relative_to(ROOT / 'overrides'))
    for name, data in generated.items():
        target = destination / safe_relative(name)
        if target.exists():
            raise ValueError('Generated compatibility file collision: ' + name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        managed[name] = digest(target)
    # Seed user preferences once, never track them as immutable pack files.
    # Oculus rewrites this file when the player changes shader settings.
    shader = next((e for e in extras if e['directory'] == 'shaderpacks'), None)
    shader_config = destination / 'config' / 'oculus.properties'
    if shader and not shader_config.exists():
        shader_config.parent.mkdir(parents=True, exist_ok=True)
        shader_config.write_text('enableShaders=true\nshaderPack=' + shader['filename'] + '\n', encoding='utf-8')
    # Jade rewrites preferences; seed once and preserve a player's later choices.
    jade_config = destination / 'config' / 'jade' / 'plugins.json'
    if side == 'client' and any(e.get('slug') == 'jade' for e in entries) and not jade_config.exists():
        jade_config.parent.mkdir(parents=True, exist_ok=True)
        jade_config.write_text(json.dumps({
            'jade': {'object_name': True, 'mod_name': True},
            'minecraft': {'entity_health': True, 'entity_health.max_for_render': 0}
        }, indent=2), encoding='utf-8')
    state = {'version': lock['version'], 'save_schema': lock.get('save_schema', 1), 'minecraft': lock['minecraft'],
             'forge': lock['forge'], 'side': side, 'visuals': visuals, 'files': managed}
    (destination / 'expedition-installed.json').write_text(json.dumps(state, indent=2), encoding='utf-8')
    print('Prepared:', destination)
    print('Use Java 17 and Forge ' + lock['forge'] + '. See README for launch instructions.')
    return destination


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--destination', required=True)
    parser.add_argument('--side', choices=['client', 'server'], default='client')
    parser.add_argument('--from-instance', type=Path)
    parser.add_argument('--stopped', action='store_true')
    parser.add_argument('--visuals', nargs='*', choices=['first-person', 'shaders'], default=None,
                        help='Optional client profiles. Omit to preserve; pass empty to remove.')
    args = parser.parse_args()
    try:
        install(args.destination, args.side, args.from_instance, args.stopped, visuals=args.visuals)
    except (ValueError, urllib.error.URLError) as exc:
        parser.exit(1, 'Installation stopped: ' + str(exc) + '\n')
