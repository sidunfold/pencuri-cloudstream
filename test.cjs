const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const code = fs.readFileSync(__dirname + '/pencuri.js','utf8');
async function scenario(type) {
  let requests=[];
  const isTv=type!=='movie';
  const title=isTv?'Example Show':'Example Movie';
  const detail='https://pencurimoviesubmalay26.site/'+(isTv?'tvshows/example-show/':'movies/example-movie-2024/');
  const ep='https://pencurimoviesubmalay26.site/episodes/example-show-s2-ep3/';
  const option="<li class='zetaflix_player_option' data-type='mv' data-post='123' data-nume='1'></li>";
  const ctx={module:{exports:{}},console,URL,Promise,setTimeout,clearTimeout,TMDB_API_KEY:'test',fetch:async(url,opts)=>{
    requests.push(url);
    let body;
    if(url.startsWith('https://api.themoviedb.org/'))body=JSON.stringify({title,name:title,release_date:'2024-01-01'});
    else if(url.includes('/?s='))body=`<a href="https://pencurimoviesubmalay26.site/movies/wrong/" title="Wrong (2024)"></a><a href="${detail}" title="${title} (2024)"></a>`;
    else if(url===detail)body=isTv?`<ul id='season-listep-2'><li><a href='${ep}'><span class='ep-num'>3</span></a></li></ul>`:option;
    else if(url===ep)body=option;
    else if(url.endsWith('/admin-ajax.php'))body=JSON.stringify({embed_url:'<iframe src="https://media.example/test.mp4"></iframe>'});
    else throw Error('unexpected URL '+url);
    return {ok:true,text:async()=>body};
  }};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  const out=await ctx.module.exports.getStreams('550',type,2,3);
  assert.equal(out.length,1);assert.equal(out[0].url,'https://media.example/test.mp4');
  assert.equal(requests.some(x=>x.includes('/wrong/')),false);
  if(isTv)assert.ok(requests.includes(ep));
  assert.equal((await ctx.module.exports.getStreams('550','unsupported')).length,0);
  assert.equal(ctx.candidates(`<a href="${detail}" title="${title} (1990)"></a>`,{title,release_date:'2024-01-01'},isTv?'tv':'movie').length,0);
}
Promise.all(['movie','tv','series'].map(scenario)).then(()=>console.log('PASS: movie, TV and series routes; exact episode; wrong title/year rejected; direct media result')).catch(e=>{console.error(e);process.exitCode=1});
