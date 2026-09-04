package load

import org.apache.jmeter.assertions.JSONPathAssertion
import org.apache.jmeter.assertions.ResponseAssertion
import org.apache.jmeter.config.Arguments
import org.apache.jmeter.control.LoopController
import org.apache.jmeter.extractor.json.jsonpath.JSONPostProcessor
import org.apache.jmeter.protocol.http.control.CookieManager
import org.apache.jmeter.protocol.http.control.Header
import org.apache.jmeter.protocol.http.control.HeaderManager
import org.apache.jmeter.protocol.http.sampler.HTTPSamplerBase
import org.apache.jmeter.protocol.http.sampler.HTTPSamplerProxy
import org.apache.jmeter.assertions.gui.AssertionGui
import org.apache.jmeter.assertions.gui.JSONPathAssertionGui
import org.apache.jmeter.config.gui.ArgumentsPanel
import org.apache.jmeter.control.gui.TestPlanGui
import org.apache.jmeter.extractor.json.jsonpath.gui.JSONPostProcessorGui
import org.apache.jmeter.protocol.http.control.gui.HttpTestSampleGui
import org.apache.jmeter.protocol.http.gui.CookiePanel
import org.apache.jmeter.protocol.http.gui.HeaderPanel
import org.apache.jmeter.testelement.TestElement
import org.apache.jmeter.testelement.TestPlan
import org.apache.jmeter.threads.ThreadGroup
import org.apache.jmeter.threads.gui.ThreadGroupGui
import org.apache.jmeter.treebuilder.dsl.testTree
import org.apache.jorphan.collections.HashTree
import org.apache.jorphan.collections.HashTreeTraverser
import org.apache.jorphan.collections.ListedHashTree

/**
 * Teaching `/api` chain as Apache JMeter 5.6 Kotlin TreeBuilder DSL (not a hand-edited JMX).
 * Knobs match the JMX etalon: `-JserverName -Jprotocol -Jport -JpathPrefix -Jusername …`.
 */
object AuthApiPlan {

    fun tree(): ListedHashTree = testTree {
        configureAll {
            stampGuiClass()
        }
        TestPlan::class {
            name = "auth-api"
            comment = "Kotlin TreeBuilder. CLI: -JapiBaseUrl -Jthreads -Jloops -Jramp -Jduration"

            +userDefinedVariables()
            +CookieManager().apply {
                name = "HTTP Cookie Manager"
                setClearEachIteration(true)
            }
            +jsonHeaders()

            ThreadGroup::class {
                name = "Thread Group"
                setProperty("ThreadGroup.num_threads", "\${threads}")
                setProperty("ThreadGroup.ramp_time", "\${ramp}")
                setProperty("ThreadGroup.duration", "\${duration}")
                setProperty("ThreadGroup.delay", "")
                setProperty("ThreadGroup.on_sample_error", "continue")
                setProperty("ThreadGroup.scheduler", "\${__P(scheduler,false)}")
                setProperty("ThreadGroup.same_user_on_next_iteration", true)
                setSamplerController(LoopController().apply {
                    setLoops("\${loops}")
                    setContinueForever(false)
                })

                HTTPSamplerProxy::class {
                    standGet("health", "/api/health")
                    +statusEquals("200")
                    +jsonEquals("\$.status", "ok")
                }
                HTTPSamplerProxy::class {
                    standPost("login", "/api/auth/login")
                    postBodyRaw = true
                    addNonEncodedArgument(
                        "",
                        "{\"username\":\"\${username}\",\"password\":\"\${password}\"}",
                        ""
                    )
                    +statusEquals("200")
                    +JSONPostProcessor().apply {
                        name = "Extract token"
                        refNames = "token"
                        jsonPathExpressions = "\$.token"
                        matchNumbers = "1"
                        defaultValues = "NOT_FOUND"
                    }
                }
                HTTPSamplerProxy::class {
                    standGet("me", "/api/auth/me")
                    +HeaderManager().apply {
                        name = "Authorization Bearer"
                        add(Header("Authorization", "Bearer \${token}"))
                    }
                    +statusEquals("200")
                    +jsonEquals("\$.username", "\${username}")
                }
                HTTPSamplerProxy::class {
                    standGet("items", "/api/items")
                    +statusEquals("200")
                    +jsonExists("\$.items[0].id")
                }
                HTTPSamplerProxy::class {
                    standPost("logout", "/api/auth/logout")
                    +statusEquals("204", assumeSuccess = true)
                }
            }
        }
    }.also { it.stampGuiClasses() }

    private fun userDefinedVariables(): Arguments = Arguments().apply {
        stampGuiClass()
        name = "User Defined Variables"
        addArgument("apiBaseUrl", "\${__P(apiBaseUrl,http://localhost:8800)}")
        addArgument("protocol", "\${__P(protocol,http)}")
        addArgument("serverName", "\${__P(serverName,localhost)}")
        addArgument("port", "\${__P(port,8800)}")
        addArgument("pathPrefix", "\${__P(pathPrefix,)}")
        addArgument("username", "\${__P(username,user1)}")
        addArgument("password", "\${__P(password,password1)}")
        addArgument("threads", "\${__P(threads,1)}")
        addArgument("loops", "\${__P(loops,1)}")
        addArgument("ramp", "\${__P(ramp,0)}")
        addArgument("duration", "\${__P(duration,0)}")
    }

    private fun jsonHeaders(): HeaderManager = HeaderManager().apply {
        name = "HTTP Header Manager"
        add(Header("Accept", "application/json"))
        add(Header("Content-Type", "application/json"))
    }

    private fun HTTPSamplerProxy.standGet(label: String, suffix: String) {
        name = label
        method = "GET"
        standTarget(suffix)
    }

    private fun HTTPSamplerProxy.standPost(label: String, suffix: String) {
        name = label
        method = "POST"
        contentEncoding = "UTF-8"
        standTarget(suffix)
    }

    private fun HTTPSamplerProxy.standTarget(suffix: String) {
        setProperty(HTTPSamplerBase.DOMAIN, "\${serverName}")
        setProperty(HTTPSamplerBase.PROTOCOL, "\${protocol}")
        setProperty(HTTPSamplerBase.PORT, "\${port}")
        path = "\${pathPrefix}$suffix"
        followRedirects = true
        autoRedirects = false
        useKeepAlive = true
        implementation = "HttpClient4"
    }

    private fun statusEquals(code: String, assumeSuccess: Boolean = false) = ResponseAssertion().apply {
        name = "HTTP $code"
        setTestFieldResponseCode()
        setToEqualsType()
        addTestString(code)
        setAssumeSuccess(assumeSuccess)
    }

    private fun jsonEquals(path: String, expected: String) = JSONPathAssertion().apply {
        name = path
        jsonPath = path
        expectedValue = expected
        isJsonValidationBool = true
        isExpectNull = false
        isInvert = false
        setIsRegex(false)
    }

    private fun jsonExists(path: String) = JSONPathAssertion().apply {
        name = "$path exists"
        jsonPath = path
        expectedValue = ""
        isJsonValidationBool = false
        isExpectNull = false
        isInvert = false
        setIsRegex(false)
    }
}

private fun TestElement.stampGuiClass() {
    isEnabled = true
    setProperty(TestElement.TEST_CLASS, javaClass.name)
    setProperty(TestElement.GUI_CLASS, guiClassName())
}

private fun TestElement.guiClassName(): String = when (this) {
    is TestPlan -> TestPlanGui::class.java.simpleName
    is ThreadGroup -> ThreadGroupGui::class.java.simpleName
    is HTTPSamplerProxy -> HttpTestSampleGui::class.java.simpleName
    is HeaderManager -> HeaderPanel::class.java.simpleName
    is CookieManager -> CookiePanel::class.java.simpleName
    is Arguments -> ArgumentsPanel::class.java.simpleName
    is ResponseAssertion -> AssertionGui::class.java.simpleName
    is JSONPathAssertion -> JSONPathAssertionGui::class.java.simpleName
    is JSONPostProcessor -> JSONPostProcessorGui::class.java.simpleName
    else -> error("No JMeter GUI mapping for ${javaClass.name}")
}

private fun HashTree.stampGuiClasses() {
    traverse(object : HashTreeTraverser {
        override fun addNode(node: Any, subTree: HashTree) {
            (node as? TestElement)?.stampGuiClass()
        }

        override fun subtractNode() {}

        override fun processPath() {}
    })
}
