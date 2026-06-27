const CACHE='mondial2026-v2';
self.addEventListener('install', e=>{ self.skipWaiting(); });
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const isDoc = e.request.mode==='navigate' || e.request.destination==='document';
  // La page HTML est toujours récupérée fraîche (contourne le cache HTTP 10 min de GitHub Pages) ;
  // le cache ne sert que de repli hors-ligne. Les autres ressources restent en network-first classique.
  const req = isDoc ? new Request(e.request.url, {cache:'no-store'}) : e.request;
  e.respondWith(
    fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(()=> caches.match(e.request))
  );
});
