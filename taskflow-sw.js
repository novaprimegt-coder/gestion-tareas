const TF_EXPORT_CACHE='taskflow-json-export-v1';
self.addEventListener('install',()=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
function safeName(value){const cleaned=String(value||'Rutina_TaskFlow.json').replace(/[\r\n"\\/]/g,'_').trim();return cleaned||'Rutina_TaskFlow.json';}
self.addEventListener('message',event=>{
  const data=event.data||{};
  if(data.type!=='TF_EXPORT_JSON')return;
  const port=event.ports&&event.ports[0];
  event.waitUntil((async()=>{
    try{
      const id=String(data.id||Date.now());
      const filename=safeName(data.filename);
      const url=new URL('./__taskflow_download__/'+encodeURIComponent(id)+'/'+encodeURIComponent(filename),self.registration.scope).href;
      const headers=new Headers({
        'Content-Type':'application/json; charset=utf-8',
        'Content-Disposition':`attachment; filename="${filename.replace(/[^\x20-\x7E]/g,'_')}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control':'no-store, max-age=0',
        'X-Content-Type-Options':'nosniff'
      });
      const cache=await caches.open(TF_EXPORT_CACHE);
      await cache.put(url,new Response(String(data.json||''),{status:200,headers}));
      if(port)port.postMessage({ok:true,url});
    }catch(error){if(port)port.postMessage({ok:false,error:String(error&&error.message||error)});}
  })());
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(!url.pathname.includes('/__taskflow_download__/'))return;
  event.respondWith((async()=>{
    const cache=await caches.open(TF_EXPORT_CACHE);
    const hit=await cache.match(event.request.url);
    if(hit)return hit;
    return new Response('{"error":"TaskFlow export no disponible"}',{status:404,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  })());
});
