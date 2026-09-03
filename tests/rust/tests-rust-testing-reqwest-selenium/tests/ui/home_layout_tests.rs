use allure_cargotest::allure_test;
use tests_rust_testing_reqwest_selenium as tests;

#[allure_test(name = "Home shows embedded header and reference layout")]
#[tokio::test]
async fn home_layout_is_mounted() {
    tests::layer_ui("Home layout mount", "Home", "Home layout", "normal");
    allure_rust_commons::tag("mock");
    tests::with_browser(|| async {
        tests::HomePage::default()
            .open_page()
            .await
            .should_show_layout()
            .await
            .header
            .should_show_embedded_header()
            .await;
    })
    .await;
}
