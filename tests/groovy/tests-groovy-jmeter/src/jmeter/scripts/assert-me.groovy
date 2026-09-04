import groovy.json.JsonSlurper

def code = prev.responseCode
if (code != '200') {
    AssertionResult.setFailure(true)
    AssertionResult.setFailureMessage("HTTP 200, got ${code}")
    return
}
def json = new JsonSlurper().parseText(prev.responseDataAsString)
def expected = vars.get('username')
if (json.username != expected) {
    AssertionResult.setFailure(true)
    AssertionResult.setFailureMessage("\$.username expected ${expected}, got ${json.username}")
}
