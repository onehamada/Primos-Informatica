/**
 * FUNÇÕES COMPARTILHADAS - PRIMOS INFORMÁTICA
 * Código comum usado em múltiplas páginas
 */

// === DESATIVAR SERVICE WORKER ===
// Remove todos os service workers registrados para evitar problemas de cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}
