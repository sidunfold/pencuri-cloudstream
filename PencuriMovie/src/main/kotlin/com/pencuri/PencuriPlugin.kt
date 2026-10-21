package com.pencuri
import android.content.Context
import com.lagradost.cloudstream3.plugins.CloudstreamPlugin
import com.lagradost.cloudstream3.plugins.Plugin
@CloudstreamPlugin
class PencuriPlugin : Plugin() {
    override fun load(context: Context) { registerMainAPI(PencuriMovie()) }
}
