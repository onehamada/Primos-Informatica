# Sistema de Autenticação - Primos Informática

## 📋 Visão Geral

Sistema completo de autenticação frontend para a loja virtual Primos Informática, desenvolvido com JavaScript vanilla e localStorage para persistência de dados.

## 🚀 Funcionalidades Implementadas

### ✅ **Login e Cadastro**
- Formulários de login e cadastro com validação completa
- Validação de email (formato e duplicidade)
- Senhas com mínimo 6 caracteres
- Confirmação de senha no cadastro
- Feedback visual de erros e sucessos

### ✅ **Persistência de Dados**
- Armazenamento de usuários no localStorage
- Senhas codificadas em Base64 (simples para demonstração)
- Sessão de usuário persistente
- Cache de dados de usuário

### ✅ **UI Dinâmica**
- Botão de autenticação que muda dinamicamente
- Menu dropdown com informações do usuário
- Animações suaves e transições
- Estados de loading durante processamento

### ✅ **Recursos Extras**
- "Esqueci minha senha" (simulado)
- Lembrar-me (placeholder)
- Termos de uso e política de privacidade
- Design responsivo mobile-first

## 📁 Estrutura de Arquivos

```
├── auth.html              # Página de autenticação
├── auth.css               # Estilos específicos da autenticação
├── auth.js                # Lógica do sistema de autenticação
├── js/script.js           # Integração com o sistema principal
└── css/styles.css         # Estilos do menu do usuário
```

## 🔧 Como Funciona

### 1. **Fluxo de Login**
1. Usuário acessa `auth.html`
2. Sistema verifica se já está logado (redireciona se positivo)
3. Preenche email e senha
4. Validação client-side
5. Verificação no localStorage
6. Cria sessão e redireciona para `index.html`

### 2. **Fluxo de Cadastro**
1. Usuário clica em "Criar Conta"
2. Preenche formulário completo
3. Validação de todos os campos
4. Verificação de email duplicado
5. Salva no localStorage
6. Redireciona para login

### 3. **Sessão Ativa**
1. Ao carregar `index.html`, verifica sessão
2. Se logado, atualiza botão de autenticação
3. Mostra nome do usuário e avatar
4. Exibe menu dropdown com opções

## 🎨 Interface do Usuário

### **Botão de Autenticação (Deslogado)**
```html
<button class="auth-btn" onclick="window.location.href='auth.html'">
  <svg>...</svg>
  <span>Entrar / Cadastrar</span>
</button>
```

### **Botão de Autenticação (Logado)**
```html
<button class="auth-btn" onclick="showUserMenu(usuario)">
  <svg>...</svg>
  <span>Nome do Usuário</span>
</button>
```

### **Menu Dropdown**
- Avatar com inicial do nome
- Nome completo e email
- Opções: Perfil, Pedidos, Sair
- Animações suaves

## 💾 Armazenamento de Dados

### **Estrutura no localStorage**
```javascript
// Usuários cadastrados
localStorage.setItem('usuarios', JSON.stringify([
  {
    nome: "Nome Completo",
    email: "email@exemplo.com", 
    senha: "cGFzc3dvcmQ=", // Base64
    dataCadastro: "2024-01-01T00:00:00.000Z"
  }
]));

// Usuário logado atual
localStorage.setItem('usuarioLogado', "email@exemplo.com");
```

## 🔐 Segurança

### **Implementado**
- ✅ Validação client-side completa
- ✅ Sanitização de inputs
- ✅ Proteção contra emails duplicados
- ✅ Senhas codificadas (Base64)

### **Limitações (Para Produção)**
- ⚠️ Base64 não é criptografia segura
- ⚠️ Falta validação server-side
- ⚠️ Não há proteção contra XSS avançada
- ⚠️ Senhas poderiam ser mais robustas

## 🎯 Estados da UI

### **Loading States**
```css
.auth-btn.loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}

.auth-btn.loading::after {
  /* Spinner animation */
}
```

### **Error States**
```css
.form-group input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.auth-error {
  background: #fef2f2;
  color: #dc2626;
  /* ... */
}
```

### **Success States**
```css
.auth-success {
  background: #10b981;
  color: white;
  /* ... */
}
```

## 🔄 Integração com Sistema Principal

### **Funções Globais Disponíveis**
```javascript
// Autenticação
window.checkAuthStatus()      // Verifica status do usuário
window.showUserMenu(usuario)  // Mostra menu dropdown
window.logout()              // Faz logout
window.viewProfile()         // Placeholder perfil
window.viewOrders()          // Placeholder pedidos

// Verificação de login
window.checkUserLoggedIn()    // Verifica e redireciona
```

### **Eventos**
- `DOMContentLoaded`: Verifica autenticação
- Click no botão auth: Mostra menu ou redireciona
- Click fora do menu: Fecha dropdown

## 📱 Responsividade

### **Mobile (< 768px)**
- Formulários ocupam 100% da largura
- Botões com padding reduzido
- Menu dropdown adaptado
- Font sizes otimizados

### **Desktop (> 768px)**
- Layout centralizado com sombras
- Hover states em todos elementos interativos
- Animações suaves
- Posicionamento preciso do dropdown

## 🚀 Melhorias Futuras

### **Curto Prazo**
- [ ] Implementar hash de senhas (SHA-256)
- [ ] Adicionar validação de força de senha
- [ ] Implementar recuperação real de senha
- [ ] Adicionar persistência de sessão extendida

### **Médio Prazo**
- [ ] Integração com backend real
- [ ] Sistema de perfis completos
- [ ] Histórico de pedidos
- [ ] Autenticação social (Google, Facebook)

### **Longo Prazo**
- [ ] Two-factor authentication
- [ ] Sistema de permissões
- [ ] Auditoria de segurança
- [ ] GDPR compliance

## 🐛 Troubleshooting

### **Problemas Comuns**

**Usuário não é mantido logado**
- Verificar se `localStorage` está disponível
- Confirmar que `usuarioLogado` é salvo corretamente
- Limpar cache e cookies

**Menu dropdown não aparece**
- Verificar se `.action-buttons` tem `position: relative`
- Confirmar se CSS está carregado
- Verificar console para erros JavaScript

**Validação não funciona**
- Verificar se `auth.js` está carregado
- Confirmar seletores CSS
- Verificar eventos attached

### **Debug Mode**
```javascript
// Ativar debug no console
localStorage.setItem('auth_debug', 'true');

// Ver dados atuais
console.log('Usuários:', JSON.parse(localStorage.getItem('usuarios')));
console.log('Logado:', localStorage.getItem('usuarioLogado'));
```

## 📞 Suporte

Para dúvidas ou problemas com o sistema de autenticação:
- Verificar console do navegador para erros
- Limpar localStorage e testar novamente
- Confirmar que todos os arquivos estão carregados

---

**Versão**: 1.0.0  
**Atualização**: Janeiro/2024  
**Compatibilidade**: ES6+  
**Dependências**: Nenhuma (JavaScript vanilla)
