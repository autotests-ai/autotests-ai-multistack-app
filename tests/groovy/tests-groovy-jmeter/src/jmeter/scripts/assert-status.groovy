def expected = '200'
if (binding.hasVariable('args') && args != null && args.length > 0) {
    expected = args[0]
} else if (binding.hasVariable('Parameters') && Parameters) {
    expected = Parameters.toString().trim().tokenize()[0]
}
def code = prev.responseCode
if (code != expected) {
    AssertionResult.setFailure(true)
    AssertionResult.setFailureMessage("HTTP ${expected}, got ${code}")
}
