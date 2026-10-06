import contextlib
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path
import install


class PreservationTests(unittest.TestCase):
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


if __name__ == '__main__': unittest.main()
