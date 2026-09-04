import groovy.json.JsonSlurper

def code = prev.responseCode
if (code != '200') {
    AssertionResult.setFailure(true)
    AssertionResult.setFailureMessage("HTTP 200, got ${code}")
    return
}
def json = new JsonSlurper().parseText(prev.responseDataAsString)
if (json.status != 'ok') {
    AssertionResult.setFailure(true)
    AssertionResult.setFailureMessage("\$.status expected ok, got ${json.status}")
}
