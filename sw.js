// SERVICE WORKER OTIMIZADO PARA PRIMOS INFORMÁTICA
const APP_VERSION = '20260406-13';
const ASSET_VERSIONS = {
  styles: '20260406-2022',
  script: '20260406-2022',
  lazyLoading: '20260316-1835',
  notifications: '20260313-1945',
  firebaseConfig: '20260402-1805',
  firebaseOrders: '20260317-1405',
  firebaseProducts: '20260326-1730',
  firebaseReviews: '20260401-1820'
};
const CACHE_NAME = `primos-informatica-${APP_VERSION}`;
const RUNTIME_CACHE = `primos-runtime-${APP_VERSION}`;

// Arquivos essenciais para cache inicial
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/auth.html',
  '/admin.html',
  '/produtos.html',
  `/css/styles.css?v=${ASSET_VERSIONS.styles}`,
  `/js/script.js?v=${ASSET_VERSIONS.script}`,
  `/js/lazy-loading.js?v=${ASSET_VERSIONS.lazyLoading}`,
  `/js/notifications.js?v=${ASSET_VERSIONS.notifications}`,
  `/js/firebase-config.js?v=${ASSET_VERSIONS.firebaseConfig}`,
  `/js/firebase-orders.js?v=${ASSET_VERSIONS.firebaseOrders}`,
  `/js/firebase-products.js?v=${ASSET_VERSIONS.firebaseProducts}`,
  `/js/firebase-reviews.js?v=${ASSET_VERSIONS.firebaseReviews}`,
  '/images/logo.png',
  '/images/favicons/favicon.ico',
  '/images/favicons/favicon-32x32.png',
  '/images/favicons/favicon-16x16.png',
  '/manifest.json'
];

// Instalação - Cache dos arquivos essenciais
self.addEventListener('install', event => {
  console.log('SW: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cacheando arquivos estáticos');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('SW: Instalação concluída');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('SW: Erro na instalação:', error);
      })
  );
});

// Ativação - Limpeza de caches antigos
self.addEventListener('activate', event => {
  console.log('SW: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('SW: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Ativação concluída');
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições - Estratégia Cache First
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  
  // Ignorar requisições de extensões e não-HTTP
  if (request.method !== 'GET' || 
      !url.protocol.startsWith('http') ||
      url.pathname.includes('extension') ||
      url.pathname.includes('chrome-extension')) {
    return;
  }

  if (!isSameOrigin && !isAPIRequest(request.url)) {
    return;
  }
  
  // Estratégias diferentes para diferentes tipos de conteúdo
  if (isImageRequest(request.url)) {
    // Stale While Revalidate para imagens de produto
    event.respondWith(staleWhileRevalidate(request));
  } else if (isStaticAsset(request.url)) {
    // Cache First para assets estáticos
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    // Network First para APIs
    event.respondWith(networkFirst(request));
  } else {
    // Network First para páginas
    event.respondWith(networkFirst(request));
  }
});

// Estratégia: Cache First
function cacheFirst(request) {
  return caches.match(request)
    .then(response => {
      if (response) {
        return response;
      }
      
      return fetch(request, { cache: 'no-cache' })
        .then(response => {
          // Verificar se resposta é válida
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          // Clonar resposta para cache
          const responseToCache = response.clone();
          
          caches.open(RUNTIME_CACHE)
            .then(cache => {
              cache.put(request, responseToCache);
            })
            .catch(error => {
              console.warn('SW: Erro ao cachear:', error);
            });
          
          return response;
        })
        .catch(error => {
          console.warn('SW: Erro no fetch:', error);
          return caches.match(request).then(cached => cached || fallbackResponse(request));
        });
    });
}

// Estratégia: Network First
function networkFirst(request) {
  return fetch(request, { cache: 'no-cache' })
    .then(response => {
      // Verificar se resposta é válida
      if (!response || response.status !== 200 || response.type === 'error') {
        return caches.match(request).then(cached => cached || fallbackResponse(request));
      }
      
      // Clonar resposta para cache
      const responseToCache = response.clone();
      
      caches.open(RUNTIME_CACHE)
        .then(cache => {
          cache.put(request, responseToCache);
        })
        .catch(error => {
          console.warn('SW: Erro ao cachear:', error);
        });
      
      return response;
    })
    .catch(error => {
      console.warn('SW: Erro no fetch network first:', error);
      // Fallback para cache
      return caches.match(request).then(cached => cached || fallbackResponse(request));
    });
}

// Estratégia: Stale While Revalidate
function staleWhileRevalidate(request) {
  const cachedResponsePromise = caches.match(request);
  
  const fetchPromise = fetch(request, { cache: 'no-cache' })
    .then(response => {
      if (!response || response.status !== 200 || response.type === 'error') {
        return caches.match(request).then(cached => cached || fallbackResponse(request));
      }

      if (response && response.status === 200 && response.type !== 'error') {
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE)
          .then(cache => {
            cache.put(request, responseToCache);
          })
          .catch(error => {
            console.warn('SW: Erro ao cachear resposta:', error);
          });
      }
      return response;
    })
    .catch(error => {
      console.warn('SW: Erro na requisição:', error);
      return caches.match(request).then(cached => cached || fallbackResponse(request));
    });
  
  // Retornar cache imediatamente, depois atualizar
  return cachedResponsePromise
    .then(cachedResponse => {
      return cachedResponse || fetchPromise;
    })
    .catch(() => {
      return fetchPromise;
    });
}

// Funções auxiliares
function isStaticAsset(url) {
  return url.includes('/css/') || 
         url.includes('/js/') || 
         url.endsWith('.css') ||
         url.endsWith('.js') ||
         url.endsWith('.woff') ||
         url.endsWith('.woff2');
}

function isAPIRequest(url) {
  return url.includes('firebaseio.com') || 
         url.includes('firestore.googleapis.com') ||
         url.includes('/api/');
}

function isImageRequest(url) {
  return url.includes('.jpg') || 
         url.includes('.jpeg') || 
         url.includes('.png') || 
         url.includes('.webp') ||
         url.includes('.gif') ||
         url.includes('/images/');
}

function fallbackResponse(request) {
  if (request.mode === 'navigate') {
    return caches.match('/index.html').then(response => {
      if (response) {
        return response;
      }

      return caches.match('/').then(rootResponse => rootResponse || Response.error());
    });
  }

  return Promise.resolve(Response.error());
}

// Limpeza periódica do cache runtime
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    cleanupRuntimeCache();
  }
});

function cleanupRuntimeCache() {
  caches.open(RUNTIME_CACHE)
    .then(cache => {
      cache.keys()
        .then(requests => {
          // Manter apenas os 50 arquivos mais recentes
          const toDelete = requests.slice(50);
          return Promise.all(
            toDelete.map(request => cache.delete(request))
          );
        });
    });
}

// Background Sync para pedidos offline
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

function syncOfflineOrders() {
  return caches.open('offline-orders')
    .then(cache => {
      return cache.keys()
        .then(requests => {
          return Promise.all(
            requests.map(request => {
              return cache.match(request)
                .then(response => response.json())
                .then(orderData => {
                  // Tentar enviar pedido
                  return fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                  });
                })
                .then(() => {
                  // Remover do cache offline se sucesso
                  return cache.delete(request);
                })
                .catch(error => {
                  console.error('Erro no sync:', error);
                });
            })
          );
        });
    });
}

console.log('Service Worker otimizado carregado!');
