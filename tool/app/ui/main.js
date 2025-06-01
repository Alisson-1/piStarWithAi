// tool/app/ui/main.js
$(document).ready(function () {
    'use strict';

    // Inicialização principal do iStar
    istar.graph = istar.setup.setupModel();
    istar.paper = istar.setup.setupDiagram(istar.graph);
    istar.setupMetamodel(istar.metamodel);
    ui.setupUi(); // Configura a UI principal, o que também finaliza a configuração do istar.graph e istar.paper

    // Carrega o modelo inicial após um pequeno atraso para permitir a renderização da UI
    setTimeout(function () {
        istar.fileManager.loadModel(istar.models.processModelParameter());
        ui.selectPaper(); // Limpa a seleção

        // Inicializa o controlador do chat APÓS o setup principal da UI e o carregamento do modelo inicial
        if (typeof chatApp !== 'undefined' && typeof chatApp.initController === 'function') {
            console.log('[Main.js] Chamando chatApp.initController().');
            chatApp.initController();
        } else {
            console.error('[Main.js] chatApp.initController não foi encontrado. O chat não será inicializado ou pode não funcionar corretamente.');
        }
    }, 10); // Um pequeno timeout

    // ui.alert(...)
});

/*definition of globals to prevent undue JSHint warnings*/
/*globals istar:false, ui:false, console:false, $:false, chatApp:false */