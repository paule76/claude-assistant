// Popup Script mit Chat-Funktionalität und Settings
let chatHistory = [];
let currentPageData = null;
let settings = {
  apiKey: '',
  claudeModel: 'claude-3-7-sonnet-20250219',
  includeText: true,
  includeLinks: true,
  includeImages: false,
  includeMeta: true,
  includeFullHtml: false,
  maxContentLength: 8000,
  maxTokens: 1024,
  temperature: 0.7
};

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const contextInput = document.getElementById('context');
  const userInput = document.getElementById('userInput');
  const sendButton = document.getElementById('sendButton');
  const clearButton = document.getElementById('clearButton');
  const statusDiv = document.getElementById('status');
  const chatContainer = document.getElementById('chatContainer');
  const pageInfo = document.getElementById('pageInfo');
  const settingsButton = document.getElementById('settingsButton');
  const settingsPanel = document.getElementById('settingsPanel');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const cancelSettingsBtn = document.getElementById('cancelSettings');

  // Lade gespeicherte Settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (result.settings) {
      settings = { ...settings, ...result.settings };
      // Entschlüssele API-Key
      if (settings.apiKey) {
        settings.apiKey = decryptApiKey(settings.apiKey);
      }
      applySettings();
    }
  });
  
  // Chat-History bleibt lokal (zu groß für sync)
  chrome.storage.local.get(['chatHistory'], (result) => {
    if (result.chatHistory) {
      chatHistory = result.chatHistory;
      displayChatHistory();
    }
  });

  // Hole aktuelle Tab-Informationen
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  pageInfo.textContent = `Aktuelle Seite: ${tab.title || tab.url}`;
  
  // Lade Seiteninhalte initial
  loadPageContent();

  // Settings Panel Toggle
  settingsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle('active');
  });

  // Schließe Settings Panel bei Klick außerhalb
  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsButton) {
      settingsPanel.classList.remove('active');
    }
  });

  // Speichere Settings
  saveSettingsBtn.addEventListener('click', () => {
    saveSettings();
    settingsPanel.classList.remove('active');
    showSuccess('Einstellungen gespeichert!');
  });

  // Abbrechen
  cancelSettingsBtn.addEventListener('click', () => {
    applySettings(); // Setze UI zurück
    settingsPanel.classList.remove('active');
  });

  // Sende Nachricht
  sendButton.addEventListener('click', sendMessage);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Chat löschen
  clearButton.addEventListener('click', () => {
    if (confirm('Möchtest du den Chat-Verlauf wirklich löschen?')) {
      chatHistory = [];
      chrome.storage.local.set({ chatHistory: [] });
      chatContainer.innerHTML = '';
    }
  });

  function applySettings() {
    // Setze UI-Werte
    document.getElementById('apiKey').value = settings.apiKey || '';
    document.getElementById('claudeModel').value = settings.claudeModel;
    document.getElementById('includeText').checked = settings.includeText;
    document.getElementById('includeLinks').checked = settings.includeLinks;
    document.getElementById('includeImages').checked = settings.includeImages;
    document.getElementById('includeMeta').checked = settings.includeMeta;
    document.getElementById('includeFullHtml').checked = settings.includeFullHtml;
    document.getElementById('maxContentLength').value = settings.maxContentLength;
    document.getElementById('maxTokens').value = settings.maxTokens;
    document.getElementById('temperature').value = settings.temperature;
  }

  function saveSettings() {
    // Lese Werte aus UI
    const rawApiKey = document.getElementById('apiKey').value.trim();
    
    settings = {
      apiKey: rawApiKey ? encryptApiKey(rawApiKey) : '', // Verschlüssele API-Key
      claudeModel: document.getElementById('claudeModel').value,
      includeText: document.getElementById('includeText').checked,
      includeLinks: document.getElementById('includeLinks').checked,
      includeImages: document.getElementById('includeImages').checked,
      includeMeta: document.getElementById('includeMeta').checked,
      includeFullHtml: document.getElementById('includeFullHtml').checked,
      maxContentLength: parseInt(document.getElementById('maxContentLength').value),
      maxTokens: parseInt(document.getElementById('maxTokens').value),
      temperature: parseFloat(document.getElementById('temperature').value)
    };

    // Speichere in Chrome Sync Storage
    chrome.storage.sync.set({ settings }, () => {
      // Update Settings im Background Script (mit unverschlüsseltem Key)
      chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: { ...settings, apiKey: rawApiKey }
      });
    });
    
    // Aktualisiere lokale settings mit unverschlüsseltem Key
    settings.apiKey = rawApiKey;
  }

  async function loadPageContent() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Injiziere Content Script falls noch nicht vorhanden
      try {
        await chrome.tabs.sendMessage(tab.id, { action: "ping" });
      } catch (e) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['claude-web-extension-content.js']
        });
      }
      
      // Hole Seiteninhalte
      currentPageData = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
    } catch (error) {
      console.error('Fehler beim Laden der Seiteninhalte:', error);
      showError('Konnte Seiteninhalte nicht laden. Bitte lade die Seite neu.');
    }
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    if (!settings.apiKey) {
      showError('Bitte speichere zuerst einen API Key in den Einstellungen');
      return;
    }

    // Füge User-Nachricht hinzu
    addMessageToChat('user', message);
    userInput.value = '';
    sendButton.disabled = true;

    // Zeige Lade-Animation
    const loadingMessage = addMessageToChat('assistant', '<span class="loading"></span><span class="loading"></span><span class="loading"></span>');

    try {
      // Bereite Seiteninhalte basierend auf Settings vor
      const filteredPageData = preparePageData(currentPageData);
      
      // Sende an Background Script
      chrome.runtime.sendMessage({
        action: 'sendChatMessage',
        message: message,
        context: contextInput.value.trim(),
        pageData: filteredPageData,
        chatHistory: chatHistory,
        settings: settings
      }, (response) => {
        // Entferne Lade-Animation
        loadingMessage.remove();
        
        if (response.error) {
          showError(response.error);
          addMessageToChat('assistant', 'Entschuldigung, es gab einen Fehler: ' + response.error);
        } else if (response.reply) {
          addMessageToChat('assistant', response.reply);
        }
        
        sendButton.disabled = false;
        userInput.focus();
      });
    } catch (error) {
      loadingMessage.remove();
      showError('Fehler beim Senden der Nachricht');
      sendButton.disabled = false;
    }
  }

  function preparePageData(pageData) {
    if (!pageData) return null;
    
    const filtered = {
      url: pageData.url,
      title: pageData.title,
      timestamp: pageData.timestamp
    };
    
    // Text
    if (settings.includeText && pageData.bodyText) {
      filtered.bodyText = pageData.bodyText.substring(0, settings.maxContentLength);
    }
    
    // Links
    if (settings.includeLinks && pageData.links) {
      filtered.links = pageData.links;
    }
    
    // Bilder
    if (settings.includeImages && pageData.images) {
      filtered.images = pageData.images;
    }
    
    // Meta
    if (settings.includeMeta && pageData.meta) {
      filtered.meta = pageData.meta;
    }
    
    // HTML
    if (settings.includeFullHtml && pageData.html) {
      filtered.html = pageData.html.substring(0, settings.maxContentLength * 2);
    }
    
    return filtered;
  }

  function addMessageToChat(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (content.includes('<span class="loading">')) {
      contentDiv.innerHTML = content;
    } else {
      contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    
    // Scroll zum Ende
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Speichere in History (außer Lade-Animation)
    if (!content.includes('loading')) {
      chatHistory.push({ role, content });
      chrome.storage.local.set({ chatHistory: chatHistory.slice(-50) }); // Behalte nur die letzten 50 Nachrichten
    }
    
    return messageDiv;
  }

  function displayChatHistory() {
    chatHistory.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${msg.role}`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = msg.content;
      
      messageDiv.appendChild(contentDiv);
      chatContainer.appendChild(messageDiv);
    });
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function showError(message) {
    statusDiv.innerHTML = `<div class="error">${message}</div>`;
    setTimeout(() => {
      statusDiv.innerHTML = '';
    }, 5000);
  }

  function showSuccess(message) {
    statusDiv.innerHTML = `<div class="success">${message}</div>`;
    setTimeout(() => {
      statusDiv.innerHTML = '';
    }, 3000);
  }
});