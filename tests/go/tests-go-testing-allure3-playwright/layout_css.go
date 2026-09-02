package tests

import (
	"regexp"
	"strconv"
	"strings"
)

const (
	ResponsiveBreakpointPx  = 768
	WideLayoutMinViewportPx = ResponsiveBreakpointPx + 1
)

var repeatColumns = regexp.MustCompile(`repeat\((\d+)`)

func GridColumnCount(gridTemplateColumns string) int {
	normalized := strings.TrimSpace(gridTemplateColumns)
	if normalized == "" || normalized == "none" {
		return 0
	}
	if match := repeatColumns.FindStringSubmatch(normalized); match != nil {
		n, _ := strconv.Atoi(match[1])
		return n
	}
	return len(strings.Fields(normalized))
}
