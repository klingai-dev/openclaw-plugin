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
        for name in ['package.json', 'openclaw.plugin.json', 'index.mjs', 'README.md', 'skills']:
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

    def test_recommended_prompts_match_skill_reference(self):
        readme = (self.root / 'README.md').read_text()
        reference = (self.root / 'skills/kling-ai/references/prompt-examples.md').read_text()
        readme_block = readme.split('### 推荐提示词\n\n', 1)[1].split('\n\n', 1)[0]
        reference_block = reference.split('## 建议提示词\n\n', 1)[1].split('\n\n', 1)[0]
        self.assertEqual(readme_block, reference_block)
        prompts = [line.removeprefix('- ') for line in readme_block.splitlines() if line.startswith('- ')]
        self.assertEqual(len(prompts), 5)
        self.assertIn('可灵图片 4.0', prompts[0])
        self.assertIn('8K', prompts[0])
        self.assertIn('连续组图', prompts[0])
        self.assertIn('可灵 4.0 ', prompts[1])
        self.assertNotIn('可灵 4.0 Flash', prompts[1])
        self.assertIn('可灵 4.0 Flash', prompts[2])

    def test_no_widget_multi_work_delivery_contract(self):
        skill = (self.root / 'skills/kling-ai/SKILL.md').read_text()
        workflow = (self.root / 'skills/kling-ai/references/tool-workflows.md').read_text()
        # The entry points must delegate to the same result contract, not cap a batch at one.
        self.assertNotIn('至多一个主结果链接', skill)
        self.assertGreaterEqual(skill.count('references/tool-workflows.md#5-归一化结果'), 2)
        self.assertIn('用户请求多作品时逐项交付实际成功作品', skill)
        for required in [
            '用户请求多作品（含连续组图）时',
            '每件作品只给一个主链接',
            '仅成功部分时交付已有作品并报告实际数量',
            '不用封面、失败作品或重复链接补足',
            '单作品请求仍最多返回一个主作品链接',
            '不得为补齐交付而重新生成',
        ]:
            self.assertIn(required, workflow)

    def test_widget_delivery_remains_single_owner(self):
        skill = (self.root / 'skills/kling-ai/SKILL.md').read_text()
        workflow = (self.root / 'skills/kling-ai/references/tool-workflows.md').read_text()
        self.assertIn('已挂载 widget 是唯一媒体预览。不要在它外部重复添加 Markdown 媒体、附件、缩略图、卡片或下载链接。', workflow)
        self.assertIn('不调用 `query_tasks` 或 `query_result`；widget 内部刷新并原位展示', workflow)
        self.assertIn('没有挂载 App 时才能使用，不与主结果链接重复展示', skill)
        self.assertIn('不启动模型轮询循环', skill)

    def test_rejects_second_region(self):
        path = self.root / 'openclaw.plugin.json'
        manifest = json.loads(path.read_text())
        manifest['mcpServers']['other'] = {'url': 'https://example.invalid/mcp'}
        path.write_text(json.dumps(manifest))
        with self.assertRaises(AssertionError):
            check.check()

    def test_rejects_missing_v4_reference(self):
        for reference in [
            'skills/kling-ai/references/capability-discovery.md',
            'skills/kling-ai/references/model-parameters.md',
            'skills/kling-ai/references/asset-workflows.md',
            'skills/kling-ai-generate-video/references/model-routing.md',
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
