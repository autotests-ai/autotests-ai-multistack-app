import allure
import pytest

from pages.home_page import HomePage

pytestmark = pytest.mark.e2e


@allure.epic("Home")
@allure.feature("Home load")
@allure.story("Home page load")
@allure.title("Home")
class TestHome:
    @allure.title("Page load fetches health and items from API")
    @allure.severity(allure.severity_level.BLOCKER)
    @pytest.mark.smoke
    def test_page_load_fetches_items(self, home_page: HomePage, config):
        (
            home_page.open_page()
            .should_show_layout()
            .should_show_health_text(f"service: {config.api_health_service}")
            .should_show_item_text("Alpha")
        )
