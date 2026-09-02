"""LayoutCss analog — java LayoutCssTest (infra-frontend)."""

from __future__ import annotations

import allure
import pytest

from layout_css import grid_column_count

pytestmark = [pytest.mark.infra, pytest.mark.infra_frontend]


@allure.epic("Test infra")
@allure.feature("Layout CSS")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("LayoutCss")
class TestLayoutCss:
    @allure.title("gridColumnCount parses grid-template-columns")
    @pytest.mark.parametrize(
        "grid_template_columns,expected",
        [
            ("repeat(3, minmax(0, 1fr))", 3),
            ("603px 603px", 2),
            ("1fr", 1),
            ("316px", 1),
            ("none", 0),
            (None, 0),
            ("", 0),
            ("   ", 0),
        ],
    )
    def test_grid_column_count_parses_grid_template_columns(
        self, grid_template_columns: str | None, expected: int
    ):
        assert grid_column_count(grid_template_columns) == expected
