let datasourceIndex = null;
document.addEventListener('DOMContentLoaded', () => {
    loadDatasources();
    document.getElementById('settingsButton').addEventListener('click', () => {
        chrome.tabs.create({url: 'options.html'});
    });
    document.getElementById('addButton').addEventListener('click', () => {
        showForm();
    });
    document.getElementById('importButton').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => {
        let file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = (e) => {
                let datasources = JSON.parse(e.target.result);
                chrome.storage.sync.get('datasources', (data) => {
                    let originalDatasources = data.datasources || [];
                    let newDatasources = originalDatasources.concat(datasources);
                    chrome.storage.sync.set({datasources: newDatasources}, () => {
                        loadDatasources();
                        updateContextMenus();
                    });
                });
            };
            reader.readAsText(file);
        }
    });
    document.getElementById('exportButton').addEventListener('click', () => {
        chrome.storage.sync.get('datasources', (data) => {
            let datasources = data.datasources || [];
            let json = JSON.stringify(datasources, null, 2);
            let blob = new Blob([json], {type: 'application/json'});
            let url = URL.createObjectURL(blob);
            chrome.tabs.create({url: url});
        });
    });
    document.getElementById('authType').addEventListener('change', (e) => {
        toggleAuthFields(e.target.value);
    });
    document.getElementById('saveButton').addEventListener('click', (e) => {
        e.preventDefault();
        saveDatasource();
    });
    document.getElementById('cancelButton').addEventListener('click', () => {
        hideForm();
    });
});

function loadDatasources() {
    chrome.storage.sync.get('datasources', (data) => {
        let datasources = data.datasources || [];
        let listDiv = document.getElementById('datasourceList');
        listDiv.innerHTML = '';
        datasources.forEach((datasource, index) => {
            let div = document.createElement('div');
            div.className = 'card mt-2';
            div.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${datasource.name}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${datasource.url}</h6>
                    <button class="btn btn-primary">Explore</button>
                    <button class="btn btn-secondary">Edit</button>
                    <button class="btn btn-danger">Delete</button>
                </div>`;
            div.querySelector('.btn-primary').addEventListener('click', () => {
                exploreDatasource(datasource);
            });
            div.querySelector('.btn-secondary').addEventListener('click', () => {
                showForm(index);
            });
            div.querySelector('.btn-danger').addEventListener('click', () => {
                deleteDatasource(index);
            });
            listDiv.appendChild(div);
        });
    });
}

function exploreDatasource(datasource) {
    chrome.storage.sync.get('endpoint', (data) => {
        let endpoint = data.endpoint || '';
        if (!endpoint) {
            alert('You MUST set the Promlens Endpoint first by clicking the gear icon in the top right corner.');
            return;
        }
        let url = `${endpoint}?s=${encodeURIComponent(datasource.url)}`;
        if (datasource.auth_type === 'Basic Auth') {
            url += `&u=${encodeURIComponent(datasource.username)}&p=${encodeURIComponent(datasource.password)}`;
        }
        chrome.tabs.create({url: url});
    });
}

function deleteDatasource(index) {
    chrome.storage.sync.get('datasources', (data) => {
        let datasources = data.datasources || [];
        datasources.splice(index, 1);
        chrome.storage.sync.set({datasources: datasources}, () => {
            loadDatasources();
            updateContextMenus();
        });
    });
}

function showForm(index = null) {
    datasourceIndex = index;
    if (index !== null) {
        loadDatasource(index);
    } else {
        document.getElementById('name').value = '';
        document.getElementById('url').value = '';
        document.getElementById('authType').value = 'None';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        toggleAuthFields('None');
    }
    document.getElementById('datasourceList').style.display = 'none';
    document.getElementById('addButton').style.display = 'none';
    document.getElementById('importButton').style.display = 'none';
    document.getElementById('exportButton').style.display = 'none';
    document.getElementById('datasourceForm').style.display = 'block';
}

function hideForm() {
    document.getElementById('datasourceList').style.display = 'block';
    document.getElementById('addButton').style.display = 'block';
    document.getElementById('importButton').style.display = 'block';
    document.getElementById('exportButton').style.display = 'block';
    document.getElementById('datasourceForm').style.display = 'none';
}

function toggleAuthFields(authType) {
    let usernameGroup = document.getElementById('usernameGroup');
    let passwordGroup = document.getElementById('passwordGroup');
    if (authType === 'Basic Auth') {
        usernameGroup.style.display = 'block';
        passwordGroup.style.display = 'block';
    } else {
        usernameGroup.style.display = 'none';
        passwordGroup.style.display = 'none';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

function loadDatasource(index) {
    chrome.storage.sync.get('datasources', (data) => {
        let datasources = data.datasources || [];
        let datasource = datasources[index];
        document.getElementById('name').value = datasource.name;
        document.getElementById('url').value = datasource.url;
        document.getElementById('authType').value = datasource.auth_type;
        document.getElementById('username').value = datasource.username;
        document.getElementById('password').value = datasource.password;
        toggleAuthFields(datasource.auth_type);
    });
}

function saveDatasource() {
    let name = document.getElementById('name').value;
    let url = document.getElementById('url').value;
    let authType = document.getElementById('authType').value;
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    let datasource = {name: name, url: url, auth_type: authType, username: username, password: password};
    chrome.storage.sync.get('datasources', (data) => {
        let datasources = data.datasources || [];
        if (datasourceIndex !== null) {
            datasources[datasourceIndex] = datasource;
        } else {
            datasources.push(datasource);
        }
        chrome.storage.sync.set({datasources: datasources}, () => {
            hideForm();
            loadDatasources();
            updateContextMenus();
        });
    });
}

function updateContextMenus() {
    chrome.runtime.sendMessage({command: "updateContextMenus"});
}