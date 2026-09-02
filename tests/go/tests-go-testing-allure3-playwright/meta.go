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
		allure.WithLabel("module", "tests-go-testing-allure3-playwright"),
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

func LayerUI(suite, epic, feature, severity string) []allure.Option {
	return append(commonMeta(),
		allure.WithSuite(suite),
		allure.WithEpic(epic),
		allure.WithFeature(feature),
		allure.WithSeverity(severity),
		allure.WithLabel("layer", "ui"),
		allure.WithTag("ui"),
		allure.WithLabel("framework", "playwright"),
	)
}

func LayerE2E(suite, epic, feature, severity string) []allure.Option {
	return append(commonMeta(),
		allure.WithSuite(suite),
		allure.WithEpic(epic),
		allure.WithFeature(feature),
		allure.WithSeverity(severity),
		allure.WithLabel("layer", "e2e"),
		allure.WithTag("e2e"),
		allure.WithLabel("framework", "playwright"),
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

func LayerInfraFrontend(suite, epic, feature, severity string) []allure.Option {
	return append(commonMeta(),
		allure.WithSuite(suite),
		allure.WithEpic(epic),
		allure.WithFeature(feature),
		allure.WithSeverity(severity),
		allure.WithLabel("layer", "infra"),
		allure.WithTag("infra"),
		allure.WithTag("infra-frontend"),
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
