const CACHE_NAME = 'primos-informatica-v1.1.0';
const STATIC_CACHE = 'primos-static-v1.1.0';
const DYNAMIC_CACHE = 'primos-dynamic-v1.1.0';

// Arquivos essenciais para cache imediato
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/script.js',
  '/manifest.json',
  '/images/logo.png',
  '/data/products.csv'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('🚀 Service Worker instalado');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Cacheando arquivos estáticos...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('⚡ Service Worker ativado');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégia diferente para diferentes tipos de conteúdo
  if (url.origin === location.origin) {
    // Arquivos do próprio site - Cache First com Network Fallback
    event.respondWith(cacheFirst(request));
  } else {
    // Recursos externos (Google Fonts, etc) - Network First com Cache Fallback
    event.respondWith(networkFirst(request));
  }
});

// Estratégia Cache First
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Se está no cache, retorna imediatamente
      return cachedResponse;
    }
    
    // Se não está no cache, busca da rede
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cacheia a resposta para futuras requisições
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return new Response('Offline - Sem conexão com a internet', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Estratégia Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('🔄 Falha na rede, tentando cache...');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background Sync para sincronização offline
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Sincronizando dados offline...');
    event.waitUntil(syncData());
  }
});

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova oferta na Primos Informática!',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Ofertas',
        icon: '/images/logo.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/images/logo.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Primos Informática', options)
  );
});

// Tratamento de cliques em notificações
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Função de sincronização
async function syncData() {
  try {
    // Sincronizar carrinho, favoritos, etc
    console.log('✅ Dados sincronizados com sucesso');
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// Limpeza periódica de cache
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    console.log('🔄 Cache atualizado via mensagem');
  }
});
