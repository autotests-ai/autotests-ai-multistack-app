use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

#[allure_test(name = "gridColumnCount parses grid-template-columns")]
#[test]
fn grid_column_count_parses_grid_template_columns() {
    tests::layer_infra("LayoutCss", "Test infra", "Layout CSS", "normal");
    let cases: &[(&str, i32)] = &[
        ("repeat(3, minmax(0, 1fr))", 3),
        ("603px 603px", 2),
        ("1fr", 1),
        ("316px", 1),
        ("none", 0),
        ("", 0),
        ("   ", 0),
    ];
    for (input, expected) in cases {
        assert_eq!(tests::grid_column_count(Some(input)), *expected, "{input:?}");
    }
    assert_eq!(tests::grid_column_count(None), 0);
}
