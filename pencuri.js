/* PencuriMovie for Nuvio. Standalone Promise-based JS for Android phone/TV.
 * Only public player responses and explicit media URLs are used.
 * Unsupported hosts return no streams; embedded webpages are never returned as videos.
 */
var BASE = 'https://pencurimoviesubmalay26.site';
function unescapeHtml(s) {
  return String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, function(_, h, d) { return String.fromCharCode(parseInt(h || d, h ? 16 : 10)); }).replace(/&#039;|&apos;/g, "'");
}
function attr(s, name) {
  var m = new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(["\x27])(.*?)\\1', 'i').exec(s);
  return m ? unescapeHtml(m[2]) : '';
}
function normalize(s) {
  return unescapeHtml(s).toLowerCase().replace(/\s*\(\d{4}\)\s*$/, '').replace(/[^a-z0-9\u00c0-\u024f]+/g, ' ').trim();
}
function absolute(s, base) { try { return new URL(unescapeHtml(s), base || BASE).href; } catch (_) { return ''; } }
function request(url, options) {
  options = options || {};
  // Use the runtime's fetch implementation; no Node/browser-only dependencies.
  var timer, controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  if (controller) options.signal = controller.signal;
  var task = fetch(url, options).then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  });
  var timeout = new Promise(function(_, reject) { timer = setTimeout(function() { if (controller) controller.abort(); reject(new Error('Request timed out')); }, 12000); });
  return Promise.race([task, timeout]).then(function(value) { clearTimeout(timer); return value; }, function(error) { clearTimeout(timer); throw error; });
}
function metadata(id, type) {
  if (!/^\d+$/.test(String(id))) return Promise.reject(new Error('Expected numeric TMDB ID'));
  if (typeof TMDB_API_KEY === 'undefined' || !TMDB_API_KEY) return Promise.reject(new Error('Nuvio runtime has no TMDB_API_KEY'));
  return request('https://api.themoviedb.org/3/' + type + '/' + id + '?api_key=' + encodeURIComponent(TMDB_API_KEY)).then(JSON.parse);
}
function candidates(html, meta, type) {
  var names = [meta.title, meta.name, meta.original_title, meta.original_name].filter(Boolean).map(normalize);
  var year = String(meta.release_date || meta.first_air_date || '').slice(0, 4);
  var re = /<a\b([^>]+)>/gi, m, out = [], seen = {};
  while ((m = re.exec(html))) {
    var url = absolute(attr(m[1], 'href'));
    if (url.indexOf(BASE + (type === 'movie' ? '/movies/' : '/tvshows/')) !== 0) continue;
    var title = attr(m[1], 'title'), y = /\((\d{4})\)\s*$/.exec(title);
    if (names.indexOf(normalize(title)) < 0 || (y && year && y[1] !== year)) continue;
    if (!seen[url]) { seen[url] = true; out.push(url); }
  }
  return out;
}
function episodePage(html, season, episode) {
  var lists = /<ul\b([^>]+)>([\s\S]*?)<\/ul>/gi, list;
  while ((list = lists.exec(html))) {
    if (attr(list[1], 'id') !== 'season-listep-' + season) continue;
    var links = /<a\b([^>]+)>([\s\S]*?)<\/a>/gi, link;
    while ((link = links.exec(list[2]))) {
      var n = /class=["'][^"']*ep-num[^"']*["'][^>]*>\s*(\d+)/i.exec(link[2]);
      var url = absolute(attr(link[1], 'href'));
      if (n && Number(n[1]) === episode && url.indexOf(BASE + '/episodes/') === 0) return url;
    }
  }
  return '';
}
function playerOptions(html) {
  var re = /<li\b([^>]*\bzetaflix_player_option\b[^>]*)>([\s\S]*?)<\/li>/gi, m, out = [];
  while ((m = re.exec(html))) {
    var n = attr(m[1], 'data-nume'), post = attr(m[1], 'data-post'), type = attr(m[1], 'data-type');
    if (!/^\d+$/.test(n) || !/^\d+$/.test(post) || !type) continue;
    out.push({ number:n, post:post, type:type });
  }
  return out;
}
function mediaUrls(text, base) {
  var normalized = unescapeHtml(text).replace(/\\\//g, '/');
  var re = /https?:\/\/[^\s"'<>\\]+\.(?:m3u8|mp4|mkv)(?:\?[^\s"'<>\\]*)?/gi;
  return (normalized.match(re) || []).filter(function(url, i, a) { return a.indexOf(url) === i; });
}
function decodePlayer(text) {
  if (/^\s*\{/.test(text)) return Promise.resolve(JSON.parse(text));
  if (!/^[0-9a-f]+$/i.test(text.trim()) || typeof crypto === 'undefined' || !crypto.subtle) return Promise.reject(new Error('Unsupported player response'));
  // Public VidStack player response encoding, not video DRM.
  var bytes = new Uint8Array(text.trim().match(/../g).map(function(x) { return parseInt(x,16); }));
  var enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode('kiemtienmua911ca'), {name:'AES-CBC'}, false, ['decrypt']).then(function(key) {
    return crypto.subtle.decrypt({name:'AES-CBC', iv:enc.encode('1234567890oiuytr')},key,bytes);
  }).then(function(raw) { return JSON.parse(new TextDecoder().decode(raw)); });
}
function extract(embed, referer) {
  var u;
  try { u = new URL(embed); } catch (_) { return Promise.resolve([]); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return Promise.resolve([]);
  if (/\.(m3u8|mp4|mkv)(\?|$)/i.test(embed)) return Promise.resolve([{url:embed, referer:referer}]);
  var headers = {Referer:referer};
  if (/^playerx\.(rpmplay\.online|seekplays\.online|p2pstream\.online|upns\.live)$/.test(u.hostname)) {
    var id = u.hash.slice(1).split('&')[0];
    if (!/^[a-z0-9]+$/i.test(id)) return Promise.resolve([]);
    return request(u.origin + '/api/v1/video?id=' + encodeURIComponent(id) + '&w=1920&h=1080&r=' + encodeURIComponent(new URL(referer).hostname), {headers:{Referer:u.origin + '/'}})
      .then(decodePlayer).then(function(data) {
        if (data.message && !data.player) throw new Error(data.message);
        return mediaUrls(JSON.stringify(data), u.origin).map(function(url) { return {url:url, referer:u.origin + '/'}; });
      });
  }
  return request(embed, {headers:headers}).then(function(html) {
    return mediaUrls(html, embed).map(function(url) { return {url:url, referer:embed}; });
  });
}
function streamsFromPage(url, html) {
  var options = playerOptions(html);
  // Bounded batches avoid opening every mirror at once on low-memory TV devices.
  var result = [], cursor = 0;
  function batch() {
    var current = options.slice(cursor, cursor + 3); cursor += 3;
    if (!current.length) return Promise.resolve(result);
    return Promise.all(current.map(function(o) {
      var body = 'action=zeta_player_ajax&post=' + encodeURIComponent(o.post) + '&nume=' + o.number + '&type=' + encodeURIComponent(o.type);
      return request(BASE + '/wp-admin/admin-ajax.php', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Referer:url},body:body})
        .then(JSON.parse).then(function(data) {
          var embed = String(data.embed_url || '');
          var tag = /<iframe\b([^>]+)>/i.exec(embed);
          var target = tag ? attr(tag[1], 'src') : embed;
          return extract(absolute(target, url), url);
        }).then(function(links) { result = result.concat(links); }).catch(function(e) {
          console.log('[PencuriMovie] Mirror ' + o.number + ': ' + e.message);
        });
    })).then(batch);
  }
  return batch().then(function(links) {
    var seen = {};
    return links.filter(function(x) { if (seen[x.url]) return false; seen[x.url] = true; return true; }).map(function(x) {
      return {name:'PencuriMovie',title:'PencuriMovie • MalaySub',url:x.url,headers:{Referer:x.referer}};
    });
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  var type = mediaType === 'series' || mediaType === 'tv' ? 'tv' : mediaType;
  if (type !== 'movie' && type !== 'tv') return Promise.resolve([]);
  if (type === 'tv' && (!(Number(season) > 0) || !(Number(episode) > 0))) return Promise.resolve([]);
  return metadata(tmdbId, type).then(function(meta) {
    var title = meta.title || meta.name;
    if (!title) throw new Error('No title found');
    return request(BASE + '/?s=' + encodeURIComponent(title)).then(function(html) {
      var matches = candidates(html, meta, type);
      if (!matches.length) return [];
      // Refuse unrelated search results rather than returning the wrong film.
      var url = matches[0];
      return request(url).then(function(detail) {
        if (type === 'movie') return streamsFromPage(url, detail);
        var ep = episodePage(detail, Number(season), Number(episode));
        return ep ? request(ep).then(function(body) { return streamsFromPage(ep, body); }) : [];
      });
    });
  }).catch(function(e) { console.log('[PencuriMovie] ' + e.message); return []; });
}
module.exports = {getStreams:getStreams};
