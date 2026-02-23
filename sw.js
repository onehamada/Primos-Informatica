// SERVICE WORKER OTIMIZADO PARA PRIMOS INFORMÁTICA
const CACHE_NAME = 'primos-informatica-v1.2.0';
const RUNTIME_CACHE = 'primos-runtime-v1.2.0';

// Arquivos essenciais para cache inicial
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/script.js',
  '/images/logo.webp',
  '/images/favicon.ico',
  '/images/favicon-32x32.png',
  '/images/favicon-16x16.png'
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
  
  // Ignorar requisições de extensões e não-HTTP
  if (request.method !== 'GET' || 
      !url.protocol.startsWith('http') ||
      url.pathname.includes('extension') ||
      url.pathname.includes('chrome-extension')) {
    return;
  }
  
  // Estratégias diferentes para diferentes tipos de conteúdo
  if (isStaticAsset(request.url)) {
    // Cache First para assets estáticos
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    // Network First para APIs
    event.respondWith(networkFirst(request));
  } else if (isImageRequest(request.url)) {
    // Stale While Revalidate para imagens
    event.respondWith(staleWhileRevalidate(request));
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
      
      return fetch(request)
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
          return null;
        });
    });
}

// Estratégia: Network First
function networkFirst(request) {
  return fetch(request)
    .then(response => {
      // Verificar se resposta é válida
      if (!response || response.status !== 200 || response.type === 'error') {
        return caches.match(request);
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
      return caches.match(request);
    });
}

// Estratégia: Stale While Revalidate
function staleWhileRevalidate(request) {
  const cachedResponsePromise = caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(response => {
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
      return null;
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
         url.includes('/images/') ||
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
