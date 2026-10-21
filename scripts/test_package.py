from pathlib import Path
import json
import shutil
import tempfile
import unittest
from unittest.mock import patch
import check


class PackageTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name).resolve()
        for name in ['package.json', 'openclaw.plugin.json', 'index.mjs', 'skills']:
            source = check.ROOT / name
            target = self.root / name
            if source.is_dir():
                shutil.copytree(source, target)
            else:
                shutil.copy2(source, target)
        self.override = patch.object(check, 'ROOT', self.root)
        self.override.start()
        self.addCleanup(self.override.stop)

    def test_standalone_package(self):
        check.check()

    def test_rejects_second_region(self):
        path = self.root / 'openclaw.plugin.json'
        manifest = json.loads(path.read_text())
        manifest['mcpServers']['other'] = {'url': 'https://example.invalid/mcp'}
        path.write_text(json.dumps(manifest))
        with self.assertRaises(AssertionError):
            check.check()

    def test_rejects_missing_v4_reference(self):
        for reference in [
            'skills/kling-ai-global-plugin/references/capability-discovery.md',
            'skills/kling-ai-global-plugin/references/model-parameters.md',
            'skills/kling-ai-global-plugin/references/asset-workflows.md',
            'skills/kling-ai-global-generate-video/references/model-routing.md',
        ]:
            with self.subTest(reference=reference):
                path = self.root / reference
                content = path.read_text()
                path.unlink()
                try:
                    with self.assertRaises(AssertionError):
                        check.check()
                finally:
                    path.write_text(content)

    def test_rejects_legacy_mcp_key(self):
        path = self.root / 'openclaw.plugin.json'
        manifest = json.loads(path.read_text())
        manifest['mcpServers']['kling-ai-global'] = manifest['mcpServers'].pop('kling-ai')
        path.write_text(json.dumps(manifest))
        with self.assertRaises(AssertionError):
            check.check()


if __name__ == '__main__':
    unittest.main()
