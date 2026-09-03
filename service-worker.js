const CACHE_NAME = "spicy-couples-bingo-v6";

const FILES = [
"./",
"./index.html",
"./style.css",
"./script.js",
"./prompts.json",
"./manifest.json"
];

self.addEventListener("install", event => {
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => cache.addAll(FILES))
.then(() => self.skipWaiting())
);
});

self.addEventListener("activate", event => {
event.waitUntil(
caches.keys()
.then(keys =>
Promise.all(
keys
.filter(key => key !== CACHE_NAME)
.map(key => caches.delete(key))
)
)
.then(() => self.clients.claim())
);
});

self.addEventListener("fetch", event => {
if (new URL(event.request.url).pathname.endsWith("/prompts.json")) {
event.respondWith(
fetch(event.request, {
cache: "no-store"
})
.then(response => {
return response;
})
.catch(() => caches.match(event.request))
);
return;
}

event.respondWith(
    fetch(event.request)
        .then(response => {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, copy);
            });

            return response;
        })
        .catch(() =>
            caches.match(event.request)
        )
);

});
