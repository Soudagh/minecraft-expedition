import contextlib
import hashlib
import io
import json
import ssl
import urllib.error
import tempfile
import unittest
from unittest.mock import patch
import zipfile
from pathlib import Path
import install


class PreservationTests(unittest.TestCase):
    def test_download_verifies_hash_before_replacing_cache(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / 'mod.jar'
            target.write_bytes(b'previous cache')
            entry = {'url': 'https://example.org/mod.jar',
                     'hashes': {'sha256': hashlib.sha256(b'expected').hexdigest()}}
            for payload, valid in [(b'tampered', False), (b'expected', True)]:
                with patch.object(install.urllib.request, 'urlopen', return_value=io.BytesIO(payload)):
                    if valid:
                        install.download_verified(entry, target)
                        self.assertEqual(target.read_bytes(), b'expected')
                    else:
                        with self.assertRaisesRegex(ValueError, 'hash mismatch'):
                            install.download_verified(entry, target)
                        self.assertEqual(target.read_bytes(), b'previous cache')
                self.assertFalse(target.with_suffix('.part').exists())

    def test_certificate_failure_explains_recovery_without_insecure_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / 'mod.jar'
            entry = {'url': 'https://example.org/mod.jar', 'hashes': {'sha256': 'unused'}}
            failure = urllib.error.URLError(ssl.SSLCertVerificationError(1, 'missing issuer'))
            with patch.object(install.urllib.request, 'urlopen', side_effect=failure) as opening:
                with self.assertRaisesRegex(ValueError, 'pip install --upgrade truststore') as raised:
                    install.download_verified(entry, target)
                self.assertIn(entry['url'], str(raised.exception))
                self.assertEqual(opening.call_count, 1)
            self.assertFalse(target.exists())
            self.assertFalse(target.with_suffix('.part').exists())

    def test_standard_context_still_verifies_certificates(self):
        with patch.dict('sys.modules', {'truststore': None}):
            ctx = install.download_context()
        self.assertEqual(ctx.verify_mode, ssl.CERT_REQUIRED)
        self.assertTrue(ctx.check_hostname)

    def test_epic_fight_upgrade_removes_only_old_renderer(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); pack = root/'pack'; pack.mkdir()
            (pack/'overrides').mkdir(); cache = root/'cache'; cache.mkdir()
            def entry(name, slug):
                data = name.encode(); (cache/name).write_bytes(data)
                return {'filename':name,'slug':slug,'side':'both',
                        'hashes':{'sha256':hashlib.sha256(data).hexdigest()}}
            first_person = entry('first.jar','first-person-model')
            first_person.update(profile='first-person', directory='mods')
            (pack/'visuals.lock.json').write_text(json.dumps({'files':[first_person]}))
            roll = entry('roll.jar','combat-roll')
            lock = {'version':'old','minecraft':'1.20.1','forge':'47.4.10',
                    'mods':[entry('better.jar','better-combat'),roll]}
            (pack/'mods.lock.json').write_text(json.dumps(lock))
            previous = install.ROOT; install.ROOT = pack
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    old = install.install(root/'old','client',cache=cache,visuals=['first-person'])
                    (old/'saves').mkdir(); (old/'saves/world.dat').write_bytes(b'unchanged world')
                    lock['mods'] = [entry('epic.jar','epic-fight'),roll]
                    (pack/'mods.lock.json').write_text(json.dumps(lock))
                    new = install.install(root/'new','client',old,True,cache)
                self.assertFalse((new/'mods/better.jar').exists())
                self.assertFalse((new/'mods/first.jar').exists())
                self.assertTrue((new/'mods/epic.jar').exists())
                self.assertTrue((new/'mods/roll.jar').exists())
                self.assertEqual((new/'saves/world.dat').read_bytes(), b'unchanged world')
                self.assertTrue((old/'mods/better.jar').exists())
                self.assertTrue((old/'mods/first.jar').exists())
            finally:
                install.ROOT = previous

    def test_optional_visuals_survive_upgrade_and_can_be_removed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack = root/'pack'; pack.mkdir()
            (pack/'overrides').mkdir()
            cache = root/'cache'; cache.mkdir()
            (cache/'visual.jar').write_bytes(b'visual')
            (cache/'shader.zip').write_bytes(b'shader')
            lock = {'version':'test','minecraft':'1.20.1','forge':'47.4.10','mods':[]}
            (pack/'mods.lock.json').write_text(json.dumps(lock))
            files = [{'profile':'shaders','directory':directory,'filename':filename,
                      'hashes':{'sha256':hashlib.sha256((cache/filename).read_bytes()).hexdigest()}}
                     for directory,filename in [('mods','visual.jar'),('shaderpacks','shader.zip')]]
            (pack/'visuals.lock.json').write_text(json.dumps({'files':files}))
            previous = install.ROOT; install.ROOT = pack
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    first = install.install(root/'first','client',cache=cache,visuals=['shaders'])
                    shader_config = first/'config/oculus.properties'
                    self.assertEqual(shader_config.read_text(), 'enableShaders=true\nshaderPack=shader.zip\n')
                    state = json.loads((first/'expedition-installed.json').read_text())
                    self.assertNotIn('config/oculus.properties', state['files'])
                    shader_config.write_text('enableShaders=false\nshaderPack=personal.zip\n')
                    (first/'options.txt').write_text('user settings')
                    second = install.install(root/'second','client',first,True,cache)
                    self.assertTrue((second/'mods/visual.jar').exists())
                    self.assertTrue((second/'shaderpacks/shader.zip').exists())
                    self.assertEqual((second/'config/oculus.properties').read_text(), shader_config.read_text())
                    third = install.install(root/'third','client',second,True,cache,visuals=[])
                    self.assertFalse((third/'mods/visual.jar').exists())
                    self.assertFalse((third/'shaderpacks/shader.zip').exists())
                    self.assertEqual((third/'options.txt').read_text(),'user settings')
                    self.assertTrue((first/'shaderpacks/shader.zip').exists())
                    with self.assertRaises(ValueError):
                        install.install(root/'server','server',cache=cache,visuals=['shaders'])
                    self.assertFalse((root/'server').exists())
                    plain = install.install(root/'plain','client',cache=cache)
                    self.assertFalse((plain/'config/oculus.properties').exists())
            finally:
                install.ROOT = previous

    def test_copy_upgrade_keeps_world_and_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack = root/'pack'; pack.mkdir()
            overrides = pack/'overrides'; overrides.mkdir()
            (overrides/'config').mkdir()
            (overrides/'config/pack.txt').write_text('v1')
            cache = root/'cache'; cache.mkdir()
            (cache/'mod.jar').write_bytes(b'fixture')
            lock = {'version':'v1','minecraft':'1.20.1','forge':'47.4.10', 'mods':[
                {'filename':'mod.jar','side':'both','hashes':{'sha256':hashlib.sha256(b'fixture').hexdigest()}}]}
            (pack/'mods.lock.json').write_text(json.dumps(lock))
            previous = install.ROOT; install.ROOT = pack
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    first = install.install(root/'first','server',cache=cache)
                    payloads = {'world/region/r.0.0.mca':b'world bytes',
                                'world/data/scoreboard.dat':b'completion',
                                'world/ftbteams/team.snbt':b'team',
                                'world/ftbquests/progress.snbt':b'quests',
                                'world/playerdata/uuid.dat':b'inventory',
                                'server.properties':b'properties', 'eula.txt':b'eula=false'}
                    for name,data in payloads.items():
                        p=first/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(data)
                    (overrides/'config/pack.txt').write_text('v2')
                    second=install.install(root/'second','server',first,True,cache)
                    for name,data in payloads.items():
                        self.assertEqual((first/name).read_bytes(),data)
                        self.assertEqual((second/name).read_bytes(),data)
                    self.assertEqual((first/'config/pack.txt').read_text(),'v1')
                    self.assertEqual((second/'config/pack.txt').read_text(),'v2')
                    lock['save_schema'] = 2
                    (pack/'mods.lock.json').write_text(json.dumps(lock))
                    with self.assertRaisesRegex(ValueError, 'migration is blocked'):
                        install.install(root/'incompatible', 'server', second, True, cache)
                    self.assertFalse((root/'incompatible').exists())
                    del lock['save_schema']
                    (pack/'mods.lock.json').write_text(json.dumps(lock))
                    with self.assertRaises(ValueError): install.install(second,'server',cache=cache)
                    with self.assertRaises(ValueError): install.install(root/'third','server',first,False,cache)
                    (first/'config/pack.txt').write_text('user edit')
                    with self.assertRaises(ValueError): install.install(root/'third','server',first,True,cache)
                    self.assertFalse((root/'third').exists())
            finally:
                install.ROOT=previous

    def test_unsafe_paths_rejected(self):
        for name in ['../world', '/etc/passwd', 'C:\\world', 'mods/../../world']:
            with self.assertRaises(ValueError): install.safe_relative(name)

    def test_generated_compatibility_files_are_preserved_and_protected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack = root/'pack'; pack.mkdir()
            (pack/'overrides').mkdir()
            cache = root/'cache'; cache.mkdir()
            jar = cache/'souls.jar'
            with zipfile.ZipFile(jar, 'w') as z:
                z.writestr('data/example/functions/fix.mcfunction', 'execut at @s run say test')
                for target in ('aw', 'nl'):
                    z.writestr('data/souls_like_bosses/tags/entity_types/'+target+'_target.json',
                               json.dumps({'values':['minecraft:player','minecraft:cow']}))
            lock = {'version':'test','minecraft':'1.20.1','forge':'47.4.10','save_schema':2,
                    'mods':[{'slug':'souls-like-bosses','curseforge_file_id':7955163,
                             'filename':jar.name,'side':'both',
                             'hashes':{'sha256':install.digest(jar)}}]}
            (pack/'mods.lock.json').write_text(json.dumps(lock))
            previous = install.ROOT; install.ROOT = pack
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    first = install.install(root/'first','server',cache=cache)
                    name = 'kubejs/data/example/functions/fix.mcfunction'
                    self.assertEqual((first/name).read_text(), 'execute at @s run say test\n')
                    self.assertIn(name, json.loads((first/'expedition-installed.json').read_text())['files'])
                    (first/'world').mkdir(); (first/'world/data').write_bytes(b'world-progress')
                    second = install.install(root/'second','server',first,True,cache)
                    self.assertEqual((second/'world/data').read_bytes(), b'world-progress')
                    self.assertEqual((first/name).read_bytes(), (second/name).read_bytes())
                    (first/name).write_text('user change')
                    with self.assertRaisesRegex(ValueError, 'Locally changed managed file'):
                        install.install(root/'third','server',first,True,cache)
                    self.assertFalse((root/'third').exists())
            finally:
                install.ROOT = previous


if __name__ == '__main__': unittest.main()
