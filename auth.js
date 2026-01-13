/**
 * SISTEMA DE AUTENTICAÇÃO - PRIMOS INFORMÁTICA
 * Funcional - localStorage para persistência
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referências aos elementos dentro do auth-container
    const authContainer = document.querySelector('.auth-container');
    if (!authContainer) return;

    const loginSection = authContainer.querySelector('#login-section');
    const cadastroSection = authContainer.querySelector('#cadastro-section');
    const showCadastroLink = authContainer.querySelector('#show-cadastro');
    const showLoginLink = authContainer.querySelector('#show-login');
    const loginForm = authContainer.querySelector('#login-form');
    const cadastroForm = authContainer.querySelector('#cadastro-form');

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
        event.preventDefault();
        
        const email = authContainer.querySelector('#login-email');
        const password = authContainer.querySelector('#login-password');
        
        let valido = true;

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
            // Verificar usuário no localStorage
            const usuario = encontrarUsuario(email.value, password.value);
            
            if (usuario) {
                // Limpar formulário primeiro
                loginForm.reset();
                
                // Salvar usuário logado no localStorage
                localStorage.setItem('usuarioLogado', usuario.email);
                
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
                mostrarErro(password, 'E-mail ou senha incorretos');
            }
        }
    }

    // Validação do formulário de cadastro
    function validarCadastro(event) {
        event.preventDefault();
        
        const nome = authContainer.querySelector('#cadastro-nome');
        const email = authContainer.querySelector('#cadastro-email');
        const senha = authContainer.querySelector('#cadastro-senha');
        const confirmarSenha = authContainer.querySelector('#cadastro-confirmar-senha');
        
        let valido = true;

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
            
            console.log('✅ Usuário cadastrado:', { 
                nome: novoUsuario.nome, 
                email: novoUsuario.email 
            });
            
            mostrarSucesso('Cadastro realizado com sucesso! Redirecionando para login...');
            
            // Limpar formulário
            cadastroForm.reset();
            
            // Redirecionar para a página de login após 2 segundos
            setTimeout(() => {
                showLogin();
            }, 2000);
            
            // Mudar para login após 2 segundos
            setTimeout(() => {
                showLogin();
            }, 2000);
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
    const showCadastroBtn = authContainer.querySelector('#show-cadastro-btn');
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
        loginForm.addEventListener('submit', validarLogin);
    }

    if (cadastroForm) {
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

    console.log('🔐 Auth system initialized with localStorage');
});
