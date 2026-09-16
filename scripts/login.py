#!/usr/bin/env python3
"""Open Kling's authorization page while OpenClaw owns OAuth and its callback."""
import subprocess
import sys
import webbrowser
from urllib.parse import urlsplit


def open_browser(url):
    if sys.platform == 'darwin':
        return subprocess.run(['open', url], check=False).returncode == 0
    return webbrowser.open(url, new=2)


def relay_login(process, opener=open_browser):
    expecting_url = False
    opened = False
    for line in process.stdout:
        text = line.strip()
        if text == 'Open this URL to authorize "kling-ai":':
            expecting_url = True
            continue
        if expecting_url:
            expecting_url = False
            parsed = urlsplit(text)
            if parsed.scheme != 'https' or parsed.hostname != 'klingai.com' or parsed.path != '/auth/authorize' or parsed.username or parsed.password:
                print('Unexpected authorization URL; login stopped without opening a browser.', file=sys.stderr)
                return 1
            if not opened:
                try:
                    opened = opener(text)
                except OSError:
                    opened = False
                if not opened:
                    print('Could not open the browser. Run openclaw mcp login kling-ai in your terminal and open its authorization link.', file=sys.stderr)
                    return 1
                print('已打开浏览器，请完成可灵授权；此终端将自动接收回调。', flush=True)
            continue
        print(line, end='', flush=True)
    return process.wait()


def main():
    process = None
    try:
        process = subprocess.Popen(['openclaw', 'mcp', 'login', 'kling-ai'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        return relay_login(process)
    except FileNotFoundError:
        print('OpenClaw is not on PATH. Install OpenClaw before connecting Kling.', file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 130
    finally:
        if process is not None and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == '__main__':
    sys.exit(main())
