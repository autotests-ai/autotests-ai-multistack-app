import groovy.json.JsonSlurper

def code = prev.responseCode
if (code != '200') {
    AssertionResult.setFailure(true)
    AssertionResult.setFailureMessage("HTTP 200, got ${code}")
    return
}
def json = new JsonSlurper().parseText(prev.responseDataAsString)
if (!json.items || json.items.isEmpty() || json.items[0]?.id == null) {
    AssertionResult.setFailure(true)
    AssertionResult.setFailureMessage("\$.items[0].id missing")
}
