import contextlib
import io
import unittest
from unittest.mock import Mock
from login import relay_login


class LoginTest(unittest.TestCase):
    def run_flow(self, output, opener=None, code=0):
        process = Mock(stdout=io.StringIO(output))
        process.wait.return_value = code
        opener = opener if opener is not None else Mock(return_value=True)
        captured = io.StringIO()
        with contextlib.redirect_stdout(captured), contextlib.redirect_stderr(captured):
            result = relay_login(process, opener)
        return result, opener, captured.getvalue()

    def test_browser_opens_once_and_url_is_not_logged(self):
        url = 'https://kling.ai/auth/authorize?state=test-sensitive'
        output = f'Open this URL to authorize "kling-ai":\n{url}\nWaiting for the browser to return to OpenClaw...\nMCP OAuth credentials saved for "kling-ai".\n'
        result, opener, logged = self.run_flow(output)
        self.assertEqual(result, 0)
        opener.assert_called_once_with(url)
        self.assertNotIn('test-sensitive', logged)
        self.assertIn('credentials saved', logged)

    def test_already_authorized_does_not_open_browser(self):
        result, opener, _ = self.run_flow('MCP OAuth credentials saved for "kling-ai".\n')
        self.assertEqual(result, 0)
        opener.assert_not_called()

    def test_cli_failure_is_preserved(self):
        self.assertEqual(self.run_flow('Connection failed\n', code=2)[0], 2)

    def test_unexpected_host_is_rejected(self):
        result, opener, logged = self.run_flow('Open this URL to authorize "kling-ai":\nhttps://example.com/auth/authorize?state=test-sensitive\n')
        self.assertEqual(result, 1)
        opener.assert_not_called()
        self.assertNotIn('test-sensitive', logged)

    def test_browser_failure_reports_manual_recovery(self):
        result, _, logged = self.run_flow('Open this URL to authorize "kling-ai":\nhttps://kling.ai/auth/authorize?state=test-sensitive\n', Mock(return_value=False))
        self.assertEqual(result, 1)
        self.assertIn('openclaw mcp login kling-ai', logged)
        self.assertNotIn('test-sensitive', logged)


if __name__ == '__main__':
    unittest.main()
