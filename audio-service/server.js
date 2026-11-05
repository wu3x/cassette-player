// Minimal public-domain / Creative Commons audio discovery proof of concept.
// Node 20+, no API keys, no audio extraction, no media proxy.
// Catalog quality and external playback are not guaranteed.
import http from 'node:http';

const PORT=Number(process.env.PORT||3000);
const ORIGIN=process.env.ALLOWED_ORIGIN||'https://wu3x.github.io';
const ALLOWED_LICENSE=/creativecommons\.org\/licenses\/(by|by-sa|by-nc|by-nc-sa|by-nd|by-nc-nd)\/|creativecommons\.org\/publicdomain\/(zero|mark)\//i;
const timeout=8000;
async function json(url){
 const response=await fetch(url,{signal:AbortSignal.timeout(timeout),headers:{'User-Agent':'cassette-discovery/0.1 (audio catalog research)'}});
 if(!response.ok)throw Error('Upstream status '+response.status);
 return response.json();
}
function send(res,status,data,requestOrigin){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':requestOrigin===ORIGIN?ORIGIN:'null','vary':'Origin'});
 res.end(JSON.stringify(data));
}
function audioFile(files){
 return files.find(f=>/\.(mp3|m4a|ogg)$/i.test(f.name||'')&&
   /^(?:VBR MP3|128Kbps MP3|64Kbps MP3|MP3|Ogg Vorbis|MPEG4 Audio|Apple Lossless Audio|Audio)$/i.test(f.format||'')&&
   Number(f.size||0)>10000);
}
async function search(q){
 const params=new URLSearchParams({
  q:'mediatype:audio AND (title:('+q.replace(/[^\p{L}\p{N}\s-]/gu,' ').trim().split(/\s+/).map(x=>'"'+x+'"').join(' OR ')+') OR creator:('+q.replace(/[^\p{L}\p{N}\s-]/gu,' ').trim().split(/\s+/).map(x=>'"'+x+'"').join(' OR ')+'))',
  'fl[]':'identifier','rows':'12','page':'1','output':'json'
 });
 const catalog=await json('https://archive.org/advancedsearch.php?'+params);
 const ids=(catalog.response?.docs||[]).map(x=>x.identifier).filter(x=>/^[\w.-]+$/.test(x)).slice(0,12);
 const entries=await Promise.allSettled(ids.map(id=>json('https://archive.org/metadata/'+encodeURIComponent(id))));
 const tracks=[];
 for(let i=0;i<entries.length;i++){
  const entry=entries[i];if(entry.status!=='fulfilled')continue;
  const data=entry.value,license=String(data.metadata?.licenseurl||'');
  if(!ALLOWED_LICENSE.test(license))continue;
  const file=audioFile(data.files||[]);if(!file)continue;
  const id=ids[i],title=data.metadata?.title,artist=data.metadata?.creator;
  tracks.push({id,source:'internet-archive',title:Array.isArray(title)?title[0]:String(title||id),
   artist:Array.isArray(artist)?artist.join('، '):String(artist||''),
   audioUrl:'https://archive.org/download/'+encodeURIComponent(id)+'/'+file.name.split('/').map(encodeURIComponent).join('/'),
   pageUrl:'https://archive.org/details/'+encodeURIComponent(id),
   licenseUrl:license,playableInCassette:true});
 }
 return tracks;
}
http.createServer(async(req,res)=>{
 const origin=req.headers.origin||'';
 if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':origin===ORIGIN?ORIGIN:'null','access-control-allow-methods':'GET, OPTIONS','vary':'Origin'});return res.end();}
 const url=new URL(req.url||'/', 'http://localhost');
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'},origin);
 if(url.pathname==='/health')return send(res,200,{ok:true,source:'internet-archive'},origin);
 if(url.pathname!=='/api/search')return send(res,404,{error:'Not found'},origin);
 const q=(url.searchParams.get('q')||'').trim();
 if(q.length<2||q.length>80)return send(res,400,{error:'Query must be 2-80 characters'},origin);
 try{return send(res,200,{tracks:await search(q),note:'Only catalog items with an explicit CC/public-domain license and a public audio file are returned. Browser playback is not guaranteed.'},origin);}
 catch(e){console.error(e);return send(res,502,{error:'Audio catalog temporarily unavailable'},origin);}
}).listen(PORT,'0.0.0.0',()=>console.log('Audio discovery prototype on',PORT));
