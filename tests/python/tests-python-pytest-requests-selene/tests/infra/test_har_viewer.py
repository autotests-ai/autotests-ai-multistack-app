"""HAR viewer HTML — java HarViewerHtmlTest (infra-frontend)."""

from __future__ import annotations

import allure
import pytest

from har_viewer import render

pytestmark = [pytest.mark.infra, pytest.mark.infra_frontend]

_HAR = (
    '{"log":{"version":"1.2","entries":[{"startedDateTime":"2026-01-01T00:00:00.000Z",'
    '"time":50,"request":{"method":"GET","url":"https://example.com/",'
    '"headers":[{"name":"Accept","value":"*/*"}]},'
    '"response":{"status":200,"statusText":"OK",'
    '"headers":[{"name":"Content-Type","value":"text/html"}],'
    '"content":{"size":42,"mimeType":"text/html"}},'
    '"timings":{"wait":40,"receive":10}}]}}'
)


@allure.epic("Test infra")
@allure.feature("HAR viewer")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("HAR viewer")
class TestHarViewerHtml:
    def test_render_builds_selenoid_like_table_with_details_without_embedded_har_data_uri(self):
        html = render(_HAR)
        assert "HAR Viewer" in html
        assert "1 requests" in html
        assert "example.com" in html
        assert '<table class="har-table"' in html
        assert ">Method</span>" in html
        assert ">Status</span>" in html
        assert ">Type</span>" in html
        assert "cols-head" not in html
        assert "Waterfall" not in html
        assert "har-detail-row" not in html
        assert "Details — Headers" not in html
        assert "<details" in html
        assert "<details open" not in html
        assert html.count('<tr class="har-row"') == 1
        assert "Response Headers" in html
        assert "Request Headers" in html
        assert "Content-Type" in html
        assert "Accept" in html
        assert "capture.har" in html
        assert "border-collapse:collapse" in html
        assert "data:application/json;base64," not in html
        assert "__CONTENT__" not in html
        assert "__SUMMARY__" not in html
