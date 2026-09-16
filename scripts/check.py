from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent.parent
SERVER = 'kling-ai-global'


def check():
    package = json.loads((ROOT / 'package.json').read_text())
    assert package['version'] == '1.1.15'
    assert package['openclaw']['extensions'] == ['./index.mjs']
    assert package['openclaw']['compat']['pluginApi'] == '>=2026.9.4'
    manifest = json.loads((ROOT / 'openclaw.plugin.json').read_text())
    assert manifest['id'] == SERVER
    assert manifest['version'] == package['version']
    assert manifest['skills'] == ['skills']
    assert manifest['categories'] == ['media']
    assert manifest['configSchema'] == {
        'type': 'object', 'additionalProperties': False, 'properties': {}}
    assert set(manifest['mcpServers']) == {SERVER}
    server = manifest['mcpServers'][SERVER]
    assert server['transport'] == 'streamable-http'
    assert server['url'] == 'https://kling.ai/mcp/plugin/'
    assert server['auth'] == 'oauth'
    assert server['supportsParallelToolCalls'] is False
    assert server['connectionTimeoutMs'] == 30000
    assert server['requestTimeoutMs'] == 60000
    assert (ROOT / 'index.mjs').exists()
    assert not (ROOT / 'plugin.json').exists()
    assert not (ROOT / 'mcp.json').exists()
    skills = sorted((ROOT / 'skills').glob('*/SKILL.md'))
    assert len(skills) == 3
    for skill in skills:
        text = skill.read_text()
        assert text.startswith('---\n')
        front = text.split('---', 2)[1]
        assert f'name: {skill.parent.name}\n' in front
        assert re.search(r'^description: .+', front, re.M)
    for path in (ROOT / 'skills').rglob('*.md'):
        text = path.read_text()
        assert 'WorkBuddy' not in text, path
        for target in re.findall(r'\]\(([^)]+)\)', text):
            if '://' not in target and not target.startswith('#'):
                referenced = (path.parent / target.split('#')[0]).resolve()
                assert referenced.is_relative_to(ROOT) and referenced.exists(), (path, target)
    for path in ROOT.rglob('*'):
        if path.is_file() and 'dist' not in path.relative_to(ROOT).parts:
            assert path.name not in {'.env', 'credentials.json', 'token.json'}, path
    print('PASS: native manifest, OAuth MCP, three Skills, references and package boundaries')


if __name__ == '__main__':
    check()
