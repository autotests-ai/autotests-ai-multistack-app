"""HAR helper — java HarCaptureTest (infra-frontend, no browser)."""

from __future__ import annotations

import json

import allure
import pytest

from har_capture import supports_browser, to_har

pytestmark = [pytest.mark.infra, pytest.mark.infra_frontend]


@allure.epic("Test infra")
@allure.feature("HAR capture")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("HAR capture")
class TestHarCapture:
    def test_supports_chrome_family(self):
        assert supports_browser("chrome")
        assert supports_browser("chromium")
        assert not supports_browser("firefox")
        assert not supports_browser(None)

    def test_to_har_builds_entries_from_performance_logs(self):
        request_msg = json.dumps(
            {
                "message": {
                    "method": "Network.requestWillBeSent",
                    "params": {
                        "requestId": "r1",
                        "timestamp": 1.0,
                        "wallTime": 1700000000.0,
                        "request": {
                            "url": "https://example.com/",
                            "method": "GET",
                            "headers": {"Accept": "*/*"},
                        },
                    },
                }
            }
        )
        response_msg = json.dumps(
            {
                "message": {
                    "method": "Network.responseReceived",
                    "params": {
                        "requestId": "r1",
                        "response": {
                            "status": 200,
                            "statusText": "OK",
                            "mimeType": "text/html",
                            "headers": {"content-type": "text/html"},
                            "protocol": "http/1.1",
                            "encodedDataLength": 42,
                        },
                    },
                }
            }
        )
        finished_msg = json.dumps(
            {
                "message": {
                    "method": "Network.loadingFinished",
                    "params": {
                        "requestId": "r1",
                        "timestamp": 1.05,
                        "encodedDataLength": 1280,
                    },
                }
            }
        )
        har = to_har(
            [
                {"message": request_msg},
                {"message": response_msg},
                {"message": finished_msg},
            ]
        )
        assert "1.2" in har
        assert "example.com" in har
        assert "200" in har
        assert "1280" in har
