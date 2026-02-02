// === SISTEMA DE NOTIFICAÇÕES ===

class NotificationSystem {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.initialized = false;
    // Não inicializar no constructor - aguardar chamada explícita
  }

  init() {
    if (this.initialized) return;
    
    // Verificar se o DOM está pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupContainer());
    } else {
      this.setupContainer();
    }
  }

  setupContainer() {
    if (this.initialized) return;
    
    // Verificar se document.body existe
    if (!document.body) {
      setTimeout(() => this.setupContainer(), 100);
      return;
    }

    // Criar container de notificações
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
    this.initialized = true;
  }

  show(message, type = 'info', title = null, duration = 5000) {
    // Aguardar inicialização se necessário
    if (!this.initialized || !this.container) {
      setTimeout(() => this.show(message, type, title, duration), 100);
      return;
    }

    const notification = this.createNotification(message, type, title);
    this.container.appendChild(notification);
    this.notifications.push(notification);

    // Animar entrada
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto remover após duração
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }

    return notification;
  }

  createNotification(message, type, title) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Ícone baseado no tipo
    const icons = {
      error: '✕',
      warning: '!',
      success: '✓',
      info: 'i'
    };

    // Títulos padrão baseados no tipo
    const defaultTitles = {
      error: 'Erro',
      warning: 'Atenção',
      success: 'Sucesso',
      info: 'Informação'
    };

    const notificationTitle = title || defaultTitles[type] || 'Notificação';
    const icon = icons[type] || 'i';

    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        <div class="notification-title">${notificationTitle}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Adicionar evento de clique para fechar
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.remove(notification);
    });

    return notification;
  }

  remove(notification) {
    if (!notification || !notification.parentElement) return;

    notification.classList.add('hide');
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
      
      // Remover do array
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }

  // Métodos de conveniência
  error(message, title = null, duration = 5000) {
    return this.show(message, 'error', title, duration);
  }

  warning(message, title = null, duration = 5000) {
    return this.show(message, 'warning', title, duration);
  }

  success(message, title = null, duration = 5000) {
    return this.show(message, 'success', title, duration);
  }

  info(message, title = null, duration = 5000) {
    return this.show(message, 'info', title, duration);
  }

  // Limpar todas as notificações
  clear() {
    this.notifications.forEach(notification => {
      this.remove(notification);
    });
  }
}

// Criar instância global
let notificationSystem;

// Funções de fallback caso o sistema não esteja pronto
function fallbackNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Fallback para alert se necessário
  if (type === 'error' || type === 'warning') {
    alert(message);
  }
}

// Criar instância quando o DOM estiver pronto
function initNotificationSystem() {
  notificationSystem = new NotificationSystem();
  notificationSystem.init();
}

// Inicializar apenas quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificationSystem);
} else {
  initNotificationSystem();
}

// Funções globais para compatibilidade
window.showNotification = function(message, type = 'info', title = null, duration = 5000) {
  if (notificationSystem && notificationSystem.initialized) {
    return notificationSystem.show(message, type, title, duration);
  } else {
    fallbackNotification(message, type);
    return null;
  }
};

window.showError = function(message, title = null, duration = 5000) {
  return window.showNotification(message, 'error', title, duration);
};

window.showWarning = function(message, title = null, duration = 5000) {
  return window.showNotification(message, 'warning', title, duration);
};

window.showSuccess = function(message, title = null, duration = 5000) {
  return window.showNotification(message, 'success', title, duration);
};

window.showInfo = function(message, title = null, duration = 5000) {
  return window.showNotification(message, 'info', title, duration);
};

window.clearNotifications = function() {
  if (notificationSystem) {
    return notificationSystem.clear();
  }
};

// Exportar para módulos se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSystem;
}
