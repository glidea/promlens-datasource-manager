document.addEventListener('DOMContentLoaded', () => {
    loadOptions();
    document.getElementById('optionsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveOptions();
    });
});

function loadOptions() {
    chrome.storage.sync.get('endpoint', (data) => {
        document.getElementById('endpoint').value = data.endpoint || '';
    });
}

function saveOptions() {
    let endpoint = document.getElementById('endpoint').value;
    chrome.storage.sync.set({endpoint: endpoint}, () => {
        window.close();
    });
}