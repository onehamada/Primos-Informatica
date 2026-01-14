/**
 * SISTEMA DE AUTENTICAÇÃO - PRIMOS INFORMÁTICA
 * Funcional - localStorage para persistência
 */

// Verificar se usuário já está logado ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Auth.html DOM carregado, iniciando sistema...');
    
    // Verificar status de login
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
        try {
            const usuario = JSON.parse(usuarioLogado);
            console.log('👤 Usuário já está logado:', usuario.nome, 'redirecionando para página principal...');
        } catch (e) {
            console.log('👤 Usuário já está logado (formato antigo), redirecionando para página principal...');
        }
        // Se já estiver logado, redirecionar para a página principal
        window.location.href = 'index.html';
    } else {
        console.log('🔓 Usuário não está logado, inicializando auth...');
        // Se não estiver logado, inicializar sistema de autenticação
        initializeAuth();
    }
});

function initializeAuth() {
    // Referências aos elementos dentro do auth-container
    const authContainer = document.querySelector('.auth-container');
    if (!authContainer) return;

    const loginSection = document.getElementById('login-section');
    const cadastroSection = document.getElementById('cadastro-section');
    const showCadastroLink = document.getElementById('show-cadastro');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const cadastroForm = document.getElementById('cadastro-form');

    console.log('🔍 Auth inicializado:', {
        authContainer: !!authContainer,
        loginSection: !!loginSection,
        cadastroSection: !!cadastroSection,
        loginForm: !!loginForm,
        cadastroForm: !!cadastroForm
    });

    // === SISTEMA DE PERSISTÊNCIA ===
    
    // Função para obter usuários do localStorage
    function getUsuarios() {
        const usuariosJSON = localStorage.getItem('usuarios');
        return usuariosJSON ? JSON.parse(usuariosJSON) : [];
    }

    // Função para salvar usuários no localStorage
    function salvarUsuarios(usuarios) {
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }

    // Função para encode simples de senha (b64 encoding básico)
    function encodeSenha(senha) {
        return btoa(senha); // Base64 encoding simples
    }

    // === CONTROLE DE USUÁRIO LOGADO ===
    
    // Função para obter usuário logado
    function getUsuarioLogado() {
        return localStorage.getItem('usuarioLogado') || null;
    }

    // Função para fazer logout do usuário
    function logoutUsuario() {
        localStorage.removeItem('usuarioLogado');
    }

    // Função para verificar se email já existe
    function emailExiste(email) {
        const usuarios = getUsuarios();
        return usuarios.some(usuario => usuario.email === email.toLowerCase());
    }

    // Função para encontrar usuário por email e senha
    function encontrarUsuario(email, senha) {
        const usuarios = getUsuarios();
        const senhaEncode = encodeSenha(senha);
        return usuarios.find(usuario => 
            usuario.email === email.toLowerCase() && usuario.senha === senhaEncode
        );
    }

    // === FUNÇÕES DE INTERFACE ===

    // Alternar entre login e cadastro
    function showLogin() {
        if (loginSection && cadastroSection) {
            loginSection.classList.remove('hidden');
            cadastroSection.classList.add('hidden');
            limparErros();
        }
    }

    function showCadastro() {
        if (loginSection && cadastroSection) {
            loginSection.classList.add('hidden');
            cadastroSection.classList.remove('hidden');
            limparErros();
        }
    }

    // Limpar mensagens de erro
    function limparErros() {
        const errorMessages = authContainer.querySelectorAll('.auth-error');
        errorMessages.forEach(msg => msg.remove());
        
        const inputs = authContainer.querySelectorAll('.form-group input');
        inputs.forEach(input => input.classList.remove('error'));
    }

    // Mostrar mensagem de erro
    function mostrarErro(input, mensagem) {
        limparErros();
        
        input.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error';
        errorDiv.textContent = mensagem;
        
        input.parentNode.appendChild(errorDiv);
    }

    // Mostrar mensagem de sucesso
    function mostrarSucesso(mensagem) {
        limparErros();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'auth-success';
        successDiv.textContent = mensagem;
        
        // Adicionar após o formulário ativo
        const activeSection = authContainer.querySelector('.auth-section:not(.hidden)');
        if (activeSection) {
            activeSection.appendChild(successDiv);
        }
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }

    // === FUNÇÕES DE AUTENTICAÇÃO ===

    // Validação do formulário de login
    function validarLogin(event) {
        console.log('🖱️ Formulário de login submetido');
        event.preventDefault();
        
        const email = document.getElementById('login-email');
        const password = document.getElementById('login-password');
        const submitBtn = document.querySelector('#login-form button[type="submit"]');
        
        console.log('📊 Dados do formulário:', {
            email: email ? email.value : 'not found',
            password: password ? 'has value' : 'not found',
            submitBtn: !!submitBtn
        });
        
        let valido = true;

        // Limpar erros anteriores
        limparErros();

        // Adicionar estado de loading
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Validar email
        if (!email.value.trim()) {
            mostrarErro(email, 'E-mail é obrigatório');
            valido = false;
        } else if (!email.value.includes('@')) {
            mostrarErro(email, 'E-mail inválido');
            valido = false;
        }

        // Validar senha
        if (!password.value.trim()) {
            mostrarErro(password, 'Senha é obrigatória');
            valido = false;
        }

        if (valido) {
            // Simular delay de processamento
            setTimeout(() => {
                // Verificar usuário no localStorage
                const usuario = encontrarUsuario(email.value, password.value);
                
                if (usuario) {
                    // Limpar formulário primeiro
                    loginForm.reset();
                    
                    // Salvar usuário logado no localStorage (objeto completo)
                    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
                    
                    // Remover loading
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                    
                    // Exibir sucesso após validação correta
                    console.log('✅ Login realizado:', { 
                        nome: usuario.nome, 
                        email: usuario.email 
                    });
                    mostrarSucesso(`Bem-vindo(a), ${usuario.nome}! Redirecionando...`);
                    
                    // Redirecionar para a página inicial após 1.5 segundos
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                    
                } else {
                    // Remover loading
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                    mostrarErro(password, 'E-mail ou senha incorretos');
                }
            }, 1000); // Simular 1 segundo de processamento
        } else {
            // Remover loading se houver erros de validação
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    // Validação do formulário de cadastro
    function validarCadastro(event) {
        event.preventDefault();
        
        const nome = document.getElementById('cadastro-nome');
        const email = document.getElementById('cadastro-email');
        const senha = document.getElementById('cadastro-senha');
        const confirmarSenha = document.getElementById('cadastro-confirmar-senha');
        const submitBtn = document.querySelector('#cadastro-form button[type="submit"]');
        
        let valido = true;

        // Limpar erros anteriores
        limparErros();

        // Adicionar estado de loading
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Validar nome
        if (!nome.value.trim()) {
            mostrarErro(nome, 'Nome é obrigatório');
            valido = false;
        } else if (nome.value.trim().length < 3) {
            mostrarErro(nome, 'Nome deve ter pelo menos 3 caracteres');
            valido = false;
        }

        // Validar email
        if (!email.value.trim()) {
            mostrarErro(email, 'E-mail é obrigatório');
            valido = false;
        } else if (!email.value.includes('@') || !email.value.includes('.')) {
            mostrarErro(email, 'E-mail inválido');
            valido = false;
        } else if (emailExiste(email.value)) {
            mostrarErro(email, 'Este e-mail já está cadastrado');
            valido = false;
        }

        // Validar senha
        if (!senha.value.trim()) {
            mostrarErro(senha, 'Senha é obrigatória');
            valido = false;
        } else if (senha.value.length < 6) {
            mostrarErro(senha, 'Senha deve ter pelo menos 6 caracteres');
            valido = false;
        }

        // Validar confirmação de senha
        if (!confirmarSenha.value.trim()) {
            mostrarErro(confirmarSenha, 'Confirmar senha é obrigatório');
            valido = false;
        } else if (senha.value !== confirmarSenha.value) {
            mostrarErro(confirmarSenha, 'Senhas não conferem');
            valido = false;
        }

        if (valido) {
            // Simular delay de processamento
            setTimeout(() => {
                // Salvar novo usuário no localStorage
                const usuarios = getUsuarios();
                const novoUsuario = {
                    nome: nome.value.trim(),
                    email: email.value.toLowerCase(),
                    senha: encodeSenha(senha.value),
                    dataCadastro: new Date().toISOString()
                };
                
                usuarios.push(novoUsuario);
                salvarUsuarios(usuarios);
                
                // Remover loading
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                
                console.log('✅ Usuário cadastrado:', { 
                    nome: novoUsuario.nome, 
                    email: novoUsuario.email 
                });
                
                mostrarSucesso('Cadastro realizado com sucesso! Faça login para continuar.');
                
                // Limpar formulário
                cadastroForm.reset();
                
                // Remover loading
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                
                // NÃO redirecionar - deixar o usuário fazer login manualmente
                // setTimeout(() => {
                //     showLogin();
                // }, 2000);
            }, 1000); // Simular 1 segundo de processamento
        } else {
            // Remover loading se houver erros de validação
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    // === EVENT LISTENERS ===

    if (showCadastroLink) {
        showCadastroLink.addEventListener('click', function(event) {
            event.preventDefault();
            showCadastro();
        });
    }

    // Event listener para o botão "Criar Conta"
    const showCadastroBtn = document.getElementById('show-cadastro-btn');
    if (showCadastroBtn) {
        showCadastroBtn.addEventListener('click', function(event) {
            event.preventDefault();
            showCadastro();
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(event) {
            event.preventDefault();
            showLogin();
        });
    }

    if (loginForm) {
        console.log('📝 Adicionando event listener ao formulário de login');
        loginForm.addEventListener('submit', validarLogin);
    }

    if (cadastroForm) {
        console.log('📝 Adicionando event listener ao formulário de cadastro');
        cadastroForm.addEventListener('submit', validarCadastro);
    }

    // Limpar erros ao digitar
    const inputs = authContainer.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (input.classList.contains('error')) {
                input.classList.remove('error');
                const errorMsg = input.parentNode.querySelector('.auth-error');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        });
    });

    // Event listener para "Esqueci minha senha"
    const forgotPasswordLink = document.getElementById('forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(event) {
            event.preventDefault();
            handleForgotPassword();
        });
    }

    console.log('🔐 Auth system initialized with localStorage');
    
    // Função de teste para debug
    window.testAuthForms = function() {
        console.log('🧪 Testando formulários de autenticação...');
        
        const loginForm = document.getElementById('login-form');
        const cadastroForm = document.getElementById('cadastro-form');
        
        console.log('📋 Status dos formulários:', {
            loginForm: !!loginForm,
            cadastroForm: !!cadastroForm,
            loginEmail: document.getElementById('login-email'),
            loginPassword: document.getElementById('login-password'),
            cadastroNome: document.getElementById('cadastro-nome'),
            cadastroEmail: document.getElementById('cadastro-email')
        });
        
        if (loginForm) {
            console.log('✅ Formulário de login encontrado, testando submit...');
            // Simular submit
            const event = new Event('submit', { cancelable: true });
            loginForm.dispatchEvent(event);
        }
        
        if (cadastroForm) {
            console.log('✅ Formulário de cadastro encontrado, testando submit...');
            // Simular submit
            const event = new Event('submit', { cancelable: true });
            cadastroForm.dispatchEvent(event);
        }
    };

    // Função para testar estados de autenticação
    window.testAuthStates = function() {
        console.log('🧪 Testando estados de autenticação...');
        
        // Testar 1: Usuário não logado (deve permanecer na página)
        console.log('📋 Teste 1: Usuário não logado');
        localStorage.removeItem('usuarioLogado');
        console.log('Estado atual:', localStorage.getItem('usuarioLogado'));
        console.log('✅ Usuário não logado - deve permanecer na página auth.html');
        
        // Testar 2: Usuário logado (deve redirecionar)
        console.log('\n📋 Teste 2: Usuário logado');
        const testUser = {
            nome: 'Test User',
            email: 'test@example.com',
            senha: btoa('password123'),
            dataCadastro: new Date().toISOString()
        };
        localStorage.setItem('usuarioLogado', JSON.stringify(testUser));
        console.log('Estado atual:', JSON.parse(localStorage.getItem('usuarioLogado')));
        console.log('⚠️  Usuário logado - recarregue a página para testar redirecionamento');
        
        // Testar 3: Limpar estado
        console.log('\n📋 Teste 3: Limpar estado');
        localStorage.removeItem('usuarioLogado');
        console.log('Estado limpo:', localStorage.getItem('usuarioLogado'));
        console.log('✅ Estado limpo - recarregue a página para testar permanência');
    };

    // Função para simular login completo
    window.simulateLogin = function(email = 'test@example.com', nome = 'Test User') {
        console.log('🧪 Simulando login completo...');
        
        // Salvar usuário no localStorage
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const usuarioExistente = usuarios.find(u => u.email === email);
        
        if (!usuarioExistente) {
            // Criar usuário de teste
            const novoUsuario = {
                nome: nome,
                email: email,
                senha: btoa('password123'), // senha codificada
                dataCadastro: new Date().toISOString()
            };
            usuarios.push(novoUsuario);
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            console.log('✅ Usuário de teste criado:', novoUsuario);
        } else {
            console.log('✅ Usuário de teste já existe:', usuarioExistente);
        }
        
        // Fazer login com objeto completo
        const usuarioParaLogin = usuarioExistente || {
            nome: nome,
            email: email,
            senha: btoa('password123'),
            dataCadastro: new Date().toISOString()
        };
        
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioParaLogin));
        console.log('✅ Login simulado:', usuarioParaLogin);
        console.log('⚠️  Recarregue a página para testar redirecionamento automático');
    };

    // Função para logout
    window.simulateLogout = function() {
        console.log('🧪 Simulando logout...');
        localStorage.removeItem('usuarioLogado');
        console.log('✅ Logout realizado');
        console.log('✅ Usuário deslogado - deve permanecer na página auth.html');
    };
}

// Função para lidar com "Esqueci minha senha"
function handleForgotPassword() {
    const email = prompt('Digite seu e-mail para recuperação de senha:');
    
    if (!email) {
        return; // Usuário cancelou
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        alert('Por favor, digite um e-mail válido.');
        return;
    }
    
    // Simular envio de e-mail de recuperação
    alert(`Um e-mail de recuperação foi enviado para: ${email}\n\n` +
          `Instruções:\n` +
          `1. Verifique sua caixa de entrada\n` +
          `2. Clique no link de redefinição\n` +
          `3. Crie uma nova senha segura\n\n` +
          `Nota: Esta é uma demonstração. Em produção, um e-mail real seria enviado.`);
}

// Adicionar funções globais para acesso externo
window.checkUserLoggedIn = checkUserLoggedIn;
window.handleForgotPassword = handleForgotPassword;
