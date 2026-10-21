package com.pencuri

import com.fasterxml.jackson.annotation.JsonProperty
import com.lagradost.cloudstream3.*
import com.lagradost.cloudstream3.utils.*
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import java.net.URLEncoder

class PencuriMovie : MainAPI() {
    override var mainUrl = "https://pencurimoviesubmalay26.site"
    override var name = "PencuriMovie Submalay"
    override var lang = "ms"
    override val hasMainPage = true
    override val supportedTypes = setOf(TvType.Movie, TvType.TvSeries)
    override val mainPage = mainPageOf("movies" to "Filem", "tvshows" to "Siri TV")

    private fun Element.image(): String? = selectFirst("img")?.let { img ->
        listOf("data-src", "data-original", "src").map { img.attr(it) }
            .firstOrNull { it.isNotBlank() && !it.startsWith("data:") }?.let { fixUrl(it) }
    }
    private fun Element.card(): SearchResponse? {
        val a = selectFirst("a[href*=/movies/], a[href*=/tvshows/]") ?: return null
        val url = fixUrl(a.attr("href"))
        val title = a.attr("title").ifBlank { selectFirst("h3")?.text().orEmpty() }
        if (title.isBlank()) return null
        val type = if (url.contains("/tvshows/")) TvType.TvSeries else TvType.Movie
        val imageUrl = image()
        return newMovieSearchResponse(title, url, type) { posterUrl = imageUrl }
    }
    override suspend fun getMainPage(page: Int, request: MainPageRequest): HomePageResponse {
        val url = "$mainUrl/${request.data}/" + if (page > 1) "page/$page/" else ""
        val doc = app.get(url).document
        val items = doc.select(".module-item, .display-item").mapNotNull { it.card() }.distinctBy { it.url }
        return newHomePageResponse(request.name, items, hasNext = doc.select("a.next").isNotEmpty())
    }
    override suspend fun search(query: String): List<SearchResponse> {
        val doc = app.get("$mainUrl/?s=${URLEncoder.encode(query, "UTF-8")}").document
        return doc.select(".display-item, .module-item").mapNotNull { it.card() }.distinctBy { it.url }
    }
    override suspend fun load(url: String): LoadResponse {
        val doc = app.get(url).document
        val title = doc.selectFirst(".details-title h3")?.text()
            ?: throw ErrorLoadingException("Tajuk tidak ditemui")
        val poster = doc.selectFirst(".poster-img")?.let { it.attr("data-src").ifBlank { it.attr("src") } }
        val synopsis = doc.selectFirst(".details-desc")?.text()
        if (url.contains("/tvshows/")) {
            val episodes = doc.select("ul.episodes-list").flatMap { seasonList ->
                val seasonNo = seasonList.id().substringAfterLast('-').toIntOrNull()
                seasonList.select("li a[href*=/episodes/]").map { a ->
                    newEpisode(fixUrl(a.attr("href"))) {
                        name = a.selectFirst(".ep-title")?.text()
                        season = seasonNo
                        episode = a.selectFirst(".ep-num")?.text()?.toIntOrNull()
                        posterUrl = a.image()
                    }
                }
            }.distinctBy { it.data }.sortedWith(compareBy({ it.season ?: 0 }, { it.episode ?: 0 }))
            return newTvSeriesLoadResponse(title, url, TvType.TvSeries, episodes) {
                posterUrl = poster
                plot = synopsis
            }
        }
        return newMovieLoadResponse(title, url, TvType.Movie, url) {
            posterUrl = poster
            plot = synopsis
        }
    }
    data class PlayerResponse(@JsonProperty("embed_url") val embedUrl: String? = null)
    override suspend fun loadLinks(data: String, isCasting: Boolean,
        subtitleCallback: (SubtitleFile) -> Unit, callback: (ExtractorLink) -> Unit): Boolean {
        val doc = app.get(data).document
        var found = false
        for (option in doc.select("li.zetaflix_player_option")) {
            val number = option.attr("data-nume")
            if (number == "fake" || number == "trailer" || number.isBlank()) continue
            try {
                val response = app.post("$mainUrl/wp-admin/admin-ajax.php", referer = data, data = mapOf(
                    "action" to "zeta_player_ajax", "post" to option.attr("data-post"),
                    "nume" to number, "type" to option.attr("data-type")
                )).parsedSafe<PlayerResponse>() ?: continue
                val embed = response.embedUrl ?: continue
                val link = Jsoup.parse(embed).selectFirst("iframe")?.attr("src")
                    ?: embed.takeIf { it.startsWith("https://") || it.startsWith("http://") } ?: continue
                loadExtractor(fixUrl(link), data, subtitleCallback) { found = true; callback(it) }
            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (_: Exception) {
                // An unavailable mirror must not stop subsequent mirrors.
            }
        }
        return found
    }
}
