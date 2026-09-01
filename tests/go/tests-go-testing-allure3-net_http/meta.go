package tests

import (
	"testing"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func Wrap(t *testing.T, displayName string, body func(*allure.Context), opts ...allure.Option) {
	t.Helper()
	allure.Wrap(t, body, append([]allure.Option{allure.WithDisplayName(displayName)}, opts...)...)
}

func commonMeta() []allure.Option {
	return []allure.Option{
		allure.WithOwner("stanislav"),
		allure.WithLabel("module", "tests-go-testing-allure3-net_http"),
		allure.WithLabel("language", "go"),
	}
}

func LayerAPI(suite, epic, feature, severity string) []allure.Option {
	return append(commonMeta(),
		allure.WithSuite(suite),
		allure.WithEpic(epic),
		allure.WithFeature(feature),
		allure.WithSeverity(severity),
		allure.WithLabel("layer", "api"),
		allure.WithTag("api"),
		allure.WithLabel("framework", "net/http"),
	)
}

func LayerInfra(suite, epic, feature, severity string) []allure.Option {
	return append(commonMeta(),
		allure.WithSuite(suite),
		allure.WithEpic(epic),
		allure.WithFeature(feature),
		allure.WithSeverity(severity),
		allure.WithLabel("layer", "infra"),
		allure.WithTag("infra"),
		allure.WithTag("infra-backend"),
	)
}

func LayerManual(suite, epic, feature, severity string) []allure.Option {
	return append(commonMeta(),
		allure.WithSuite(suite),
		allure.WithEpic(epic),
		allure.WithFeature(feature),
		allure.WithSeverity(severity),
		allure.WithLabel("layer", "manual"),
		allure.WithTag("manual"),
		allure.WithLabel("ALLURE_MANUAL", "true"),
	)
}
