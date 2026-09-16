from pathlib import Path
import json
from zipfile import ZipFile, ZIP_DEFLATED
from check import ROOT, check

check()
package = json.loads((ROOT / 'package.json').read_text())
files = {ROOT / 'package.json'}
for entry in package['files']:
    path = ROOT / entry
    assert path.exists(), path
    files.update(path.rglob('*') if path.is_dir() else [path])
output = ROOT / 'dist' / f"{package['name']}-{package['version']}.zip"
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(files):
        relative = path.relative_to(ROOT)
        if path.is_file() and not any(part.startswith('.') or part == '__pycache__' for part in relative.parts):
            archive.write(path, relative)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert {'index.mjs', 'openclaw.plugin.json', 'package.json'}.issubset(archive.namelist())
print(output)
