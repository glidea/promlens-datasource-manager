chrome.runtime.onInstalled.addListener(function() {
    createContextMenu();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command === "updateContextMenus") {
        createContextMenu();
    }
});

function createContextMenu() {
    chrome.contextMenus.removeAll(function() {
        chrome.contextMenus.create({
            id: 'datasources',
            title: 'Promlens Query',
            contexts: ['selection'],
        });

        chrome.storage.sync.get(['datasources'], function(result) {
            let datasources = result.datasources ? result.datasources : [];
            datasources.forEach(function(datasource) {
                chrome.contextMenus.create({
                    parentId: 'datasources',
                    id: datasource.url,
                    title: datasource.name,
                    contexts: ['selection']
                });
            });
        });
    });
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    chrome.storage.sync.get(['datasources'], function(data) {
        let datasources = data.datasources || [];
        let datasource = datasources.find(function(datasource) {
            return datasource.url === info.menuItemId;
        });
        if (datasource) {
            chrome.storage.sync.get('endpoint', (data) => {
                let endpoint = data.endpoint || '';
                if (!endpoint) {
                    return;
                }
                let url = `${endpoint}?s=${encodeURIComponent(datasource.url)}&q=${encodeURIComponent(info.selectionText)}`;
                if (datasource.auth_type === 'Basic Auth') {
                    url += `&u=${encodeURIComponent(datasource.username)}&p=${encodeURIComponent(datasource.password)}`;
                }
                chrome.tabs.create({url: url});
            });
        }
    });
});