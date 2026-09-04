package load

import java.io.File
import org.apache.jmeter.save.SaveService
import org.apache.jmeter.util.JMeterUtils

/**
 * Materialize the Kotlin TreeBuilder plan as JMX for the stock JMeter CLI.
 * Args: <out.jmx> <jmeterHome>
 */
fun main(args: Array<String>) {
    require(args.size == 2) { "usage: WriteJmx <out.jmx> <jmeterHome>" }
    val out = File(args[0])
    val home = File(args[1])
    require(home.resolve("bin/jmeter.properties").isFile) { "JMeter home missing properties: $home" }

    JMeterUtils.setJMeterHome(home.absolutePath)
    JMeterUtils.loadJMeterProperties(home.resolve("bin/jmeter.properties").absolutePath)
    JMeterUtils.initLocale()
    SaveService.loadProperties()

    out.parentFile.mkdirs()
    out.outputStream().use { SaveService.saveTree(AuthApiPlan.tree(), it) }
    println("Wrote ${out.absolutePath}")
}
