// tool/app/ui/controllers/chatController.js

var chatApp = chatApp || {};
let chatHasBeenWelcomed = false; // Controla se a mensagem de boas-vindas já foi enviada nesta sessão
// chatApp.allowMultipleWelcomes = false; // Defina como true no console se quiser testar as boas-vindas múltiplas vezes

// --- Funções Helper ---
function _chatAppEscapeHtml(text) {
    if (typeof text !== 'string') return '';
    var map = {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function _chatAppAddMessageToChat(chatMessagesArea, messageHtml) {
    if (chatMessagesArea && chatMessagesArea.length) {
        chatMessagesArea.append(messageHtml);
        // Auto-scroll para a última mensagem
        chatMessagesArea.scrollTop(chatMessagesArea[0].scrollHeight);
    }
}

function _chatAppSendWelcomeMessages(chatMessagesAreaElement) {
    // A flag chatApp.allowMultipleWelcomes pode ser definida como true no console para testar
    if (chatHasBeenWelcomed && !chatApp.allowMultipleWelcomes) {
        return; // Não envia novamente se já deu boas-vindas e não permite múltiplas
    }

    const welcomeMessage1 = "Olá! Este é um chatbot com IA em desenvolvimento, parte de um pré-projeto de mestrado conduzido pelo aluno Alisson Gabriel, com foco na utilização de LLM em Engenharia de Requisitos.";
    const welcomeMessage2 = "Você pode testar adicionando um ator com o comando: <strong>Adicionar ator [NomeDoAtor]</strong> (por exemplo: Adicionar ator Cliente).";

    const welcomeHtml1 =
        '<div class="chat-message-wrapper agent-message-wrapper">' + // Classe wrapper para agente
            '<div class="chat-message agent">' +
                '<p>' + welcomeMessage1 + '</p>' + // Não precisa escapar, pois é texto fixo e seguro
            '</div>' +
        '</div>';
    const welcomeHtml2 =
        '<div class="chat-message-wrapper agent-message-wrapper">' + // Classe wrapper para agente
            '<div class="chat-message agent">' +
                '<p>' + welcomeMessage2 + '</p>' + // HTML seguro aqui (<strong>)
            '</div>' +
        '</div>';

    _chatAppAddMessageToChat(chatMessagesAreaElement, welcomeHtml1);
    setTimeout(function() {
        _chatAppAddMessageToChat(chatMessagesAreaElement, welcomeHtml2);
    }, 700); // Atraso para a segunda mensagem de boas-vindas

    chatHasBeenWelcomed = true; // Marca que as boas-vindas foram dadas
}

function _chatAppProcessUserCommandAndRespond(userMessageText, chatMessagesAreaElement) {
    const lowerCaseMessage = userMessageText.toLowerCase();
    const commandPrefix = "adicionar ator ";
    let agentResponseText = "";

    if (typeof istar === 'undefined') {
        agentResponseText = "Erro crítico: O sistema de modelagem (istar) não está acessível.";
        console.error('[ChatApp ERRO] Objeto istar é UNDEFINED ao tentar processar comando.');
        // A mensagem de erro será adicionada pelo bloco setTimeout abaixo
    } else if (lowerCaseMessage.startsWith(commandPrefix)) {
        let actorNameFromUser = userMessageText.substring(commandPrefix.length).trim();
        if (actorNameFromUser) {
            const actorNameCapitalized = actorNameFromUser.charAt(0).toUpperCase() + actorNameFromUser.slice(1).toLowerCase();
            try {
                if (typeof istar.addActor === 'function' && istar.graph && istar.paper) {
                    const returnedNode = istar.addActor(null, {}); // Adiciona um ator genérico
                    let newNode = null;

                    if (returnedNode && typeof returnedNode.isElement === 'function' && returnedNode.isElement()) {
                        newNode = returnedNode;
                        // Tenta selecionar o nó. istar.select pode ainda ser undefined, mas não quebra a lógica.
                        if (typeof istar.select === 'function') {
                            istar.select(newNode);
                            // Se a seleção atualizar istar.selected globalmente, usamos essa referência
                            if (istar.selected && istar.selected.id === newNode.id) {
                                newNode = istar.selected;
                            }
                        }
                    }
                    // Fallback se returnedNode não for o esperado, mas istar.selected foi definido por algum motivo
                    // (improvável se istar.select for undefined, mas seguro verificar)
                    else if (istar.selected && typeof istar.selected.isElement === 'function' && istar.selected.isElement()) {
                        newNode = istar.selected;
                         console.warn('[ChatApp WARN] Usando istar.selected como fallback para newNode.');
                    }
                    
                    if (newNode) {
                        newNode.attr('text/text', actorNameCapitalized); // Altera o texto visual no MODELO
                        newNode.set('name', actorNameCapitalized);      // Altera a propriedade 'name' do modelo (experimental)
                        
                        const cellView = istar.paper.findViewByModel(newNode);
                        if (cellView && typeof cellView.update === 'function') {
                            cellView.update(); // Pede à view para se re-renderizar
                        }
                        
                        // Atualiza a tabela de propriedades se o nó estiver (supostamente) selecionado
                        if (typeof ui !== 'undefined' && ui.propertiesTableView && 
                            ( (istar.selected && istar.selected.id === newNode.id) || (!istar.selected && newNode) ) ) {
                           if (typeof ui.propertiesTableView.update === 'function') { ui.propertiesTableView.update(newNode); }
                           else if (typeof ui.propertiesTableView.render === 'function') { ui.propertiesTableView.render(); }
                        }
                        
                        agentResponseText = "Ator '" + _chatAppEscapeHtml(actorNameCapitalized) + "' foi adicionado e nomeado.";
                        console.log('[ChatApp INFO] Ator adicionado e nomeado: ' + actorNameCapitalized);

                        // Chamar AUTO-LAYOUT
                        if (typeof istar.layout !== 'undefined' && typeof istar.layout.layout === 'function') {
                            try {
                                istar.layout.layout();
                                agentResponseText += " Auto-layout acionado.";
                                if (typeof ui !== 'undefined' && typeof ui.selectPaper === 'function') {
                                    ui.selectPaper(); // Limpa seleção após layout
                                }
                            } catch (layoutError) {
                                console.error('[ChatApp ERRO] Erro ao executar auto-layout:', layoutError);
                                agentResponseText += " Problema ao acionar auto-layout.";
                            }
                        } else {
                            console.warn('[ChatApp WARN] Função de auto-layout (istar.layout.layout) não encontrada.');
                            agentResponseText += " (Auto-layout não encontrado).";
                        }
                    } else {
                        agentResponseText = "Ator foi possivelmente adicionado, mas não foi possível obter uma referência válida para renomear.";
                        console.warn('[ChatApp WARN] Falha ao obter referência válida para o novo nó após istar.addActor.');
                    }
                } else {
                    agentResponseText = "Erro interno: A função 'addActor' não está disponível ou o sistema de modelagem não está pronto.";
                    console.error('[ChatApp ERRO] istar.addActor não é uma função ou istar.graph/istar.paper não estão prontos.');
                }
            } catch (error) {
                console.error('[ChatApp ERRO] Exceção ao tentar adicionar/renomear ator:', error, error.stack);
                agentResponseText = "Ocorreu uma exceção ao processar seu pedido: " + _chatAppEscapeHtml(error.message);
            }
        } else {
            agentResponseText = "Por favor, forneça um nome para o ator. Exemplo: Adicionar ator Cliente";
        }
    } else { // Comando não reconhecido
        agentResponseText = "Desculpe, não reconheci o comando \"" + _chatAppEscapeHtml(userMessageText) +
                            "\". Esta funcionalidade ainda está em desenvolvimento.";
    }

    // Envia a resposta do agente (seja de sucesso, erro ou não reconhecimento)
    setTimeout(function() {
        const agentMessageHtml =
            '<div class="chat-message-wrapper agent-message-wrapper">' + // Classe wrapper para agente
                '<div class="chat-message agent">' +
                    '<p>' + agentResponseText + '</p>' +
                '</div>' +
            '</div>';
        _chatAppAddMessageToChat(chatMessagesAreaElement, agentMessageHtml);
    }, 500); // Pequeno atraso para a resposta
}

// Função principal de inicialização do chat controller
chatApp.initController = function() {
    'use strict';

    const chatToggleButton = $('#chat-toggle-button');
    const chatModal = $('#chatModal');
    const chatInput = $('#chat-input');
    const chatSendButton = $('#chat-send-button');
    const chatMessagesArea = $('#chat-messages-area'); 

    if (!chatInput.length || !chatSendButton.length || !chatMessagesArea.length || !chatModal.length) {
        console.warn('[ChatApp] Elementos da UI do chat não encontrados em initController. O chat pode não funcionar corretamente.');
        return;
    }
    // console.log('[ChatApp] chatApp.initController() chamado.'); // Removido para limpar console

    // Envia mensagens de boas-vindas quando o modal é mostrado
    // A flag chatApp.allowMultipleWelcomes pode ser definida como true no console para testar múltiplas boas-vindas
    // chatApp.allowMultipleWelcomes = false; // Descomente e defina se quiser controlar isso programaticamente
    chatModal.on('shown.bs.modal', function () {
        // Envia mensagens de boas-vindas se o chat estiver vazio ou se ainda não deu boas-vindas (controlado pela flag)
        if (chatMessagesArea.is(':empty') || !chatHasBeenWelcomed) {
            _chatAppSendWelcomeMessages(chatMessagesArea);
        }
    });

    function handleSendMessage() {
        const messageText = chatInput.val().trim();
        if (messageText) {
            // Adiciona a mensagem do usuário com o wrapper correto
            const userMessageHtml =
                '<div class="chat-message-wrapper user-message-wrapper">' +
                    '<div class="chat-message user">' +
                        '<p>' + _chatAppEscapeHtml(messageText) + '</p>' +
                    '</div>' +
                '</div>';
            _chatAppAddMessageToChat(chatMessagesArea, userMessageHtml);
            chatInput.val('');
            _chatAppProcessUserCommandAndRespond(messageText, chatMessagesArea);
        }
    }

    // Listeners de evento
    if (chatToggleButton.length) {
        chatToggleButton.on('click', function() {  chatModal.modal('toggle'); });
    }
    $(document).on('mouseup', function(e) { // Fechar ao clicar fora
        if (chatModal.length && chatModal.hasClass('in')) { // Se modal está aberto
            const modalContent = chatModal.find('.modal-content');
            if (!modalContent.is(e.target) && modalContent.has(e.target).length === 0 &&
                !chatToggleButton.is(e.target) && chatToggleButton.has(e.target).length === 0) {
                chatModal.modal('hide');
            }
        }
    });
    chatSendButton.on('click', handleSendMessage);
    chatInput.on('keypress', function(event) {
        if (event.which === 13) { // Enter
            event.preventDefault();
            handleSendMessage();
        }
    });
};