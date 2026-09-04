import groovy.json.JsonSlurper

def json = new JsonSlurper().parseText(prev.responseDataAsString)
vars.put('token', (json?.token ?: 'NOT_FOUND') as String)
