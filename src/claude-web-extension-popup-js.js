// Popup Script mit Chat-Funktionalität und Settings
let chatHistory = [];
let currentPageData = null;
let currentDomain = null; // Aktuelle Domain für domain-spezifische Chats
let markdownViewEnabled = true; // Standard: Markdown an
let settings = {
  apiKey: '',
  claudeModel: 'claude-3-5-sonnet-20241022',
  includeText: true,
  includeLinks: true,
  includeImages: false,
  includeMeta: true,
  includeFullHtml: false,
  maxContentLength: 8000,
  maxTokens: 1024,
  temperature: 0.7
};

// Konfiguriere marked.js wenn verfügbar
if (typeof marked !== 'undefined') {
  marked.setOptions({
    breaks: true, // Zeilenumbrüche wie in GitHub
    gfm: true, // GitHub Flavored Markdown
    highlight: function(code, lang) {
      if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {}
      }
      return code;
    }
  });
}

// Hilfsfunktion um Domain aus URL zu extrahieren
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return 'unknown';
  }
}

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
  const highlightTextBtn = document.getElementById('highlightTextBtn');
  const captureScreenBtn = document.getElementById('captureScreenBtn');
  const contextToggle = document.getElementById('contextToggle');
  const contextContent = document.getElementById('contextContent');
  const licensesLink = document.getElementById('licensesLink');
  const licenseModal = document.getElementById('licenseModal');
  const closeLicenseModal = document.getElementById('closeLicenseModal');
  const openInTabButton = document.getElementById('openInTabButton');
  const deleteModal = document.getElementById('deleteModal');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');
  
  // Größen-Auswahl
  const sizeButtons = document.querySelectorAll('.size-button');
  const body = document.body;
  
  const sizes = {
    small: { width: 400, height: 500 },
    medium: { width: 500, height: 600 },
    large: { width: 600, height: 700 },
    xlarge: { width: 700, height: 800 }
  };
  
  // Lade gespeicherte Größe
  chrome.storage.local.get(['popupSize'], (result) => {
    const savedSize = result.popupSize || 'medium';
    if (sizes[savedSize]) {
      const size = sizes[savedSize];
      body.style.width = size.width + 'px';
      body.style.height = size.height + 'px';
      
      // Wichtig: Setze auch HTML-Element Größe
      document.documentElement.style.width = size.width + 'px';
      document.documentElement.style.height = size.height + 'px';
      
      // Setze size-Klasse am body
      body.classList.add(`size-${savedSize}`);
      
      // Setze aktiven Button
      sizeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === savedSize);
      });
    }
  });
  
  // Size Button Click Handler
  sizeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const size = button.dataset.size;
      if (sizes[size]) {
        // Setze neue Größe
        body.style.width = sizes[size].width + 'px';
        body.style.height = sizes[size].height + 'px';
        
        // Wichtig: Setze auch HTML-Element Höhe für Chrome Extensions
        document.documentElement.style.width = sizes[size].width + 'px';
        document.documentElement.style.height = sizes[size].height + 'px';
        
        // Setze size-Klasse am body für responsive Styles
        body.className = body.className.replace(/size-\w+/g, '');
        body.classList.add(`size-${size}`);
        
        // Update aktive Klasse
        sizeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Speichere Auswahl
        chrome.storage.local.set({ popupSize: size });
        
        // Force Layout Recalculation
        setTimeout(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
      }
    });
  });

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
  
  // Hole aktuelle Tab-Informationen und Domain
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentDomain = getDomainFromUrl(tab.url);
  
  // Zeige Domain in der Page Info
  pageInfo.innerHTML = `<strong>${currentDomain}</strong><br>${tab.title || tab.url}`;
  
  // Lade domain-spezifische Chat-History
  const chatKey = `chatHistory_${currentDomain}`;
  
  // Migriere alte globale chatHistory falls vorhanden
  chrome.storage.local.get(['chatHistory', chatKey], (result) => {
    if (result[chatKey]) {
      // Domain-spezifische History vorhanden
      chatHistory = result[chatKey];
      displayChatHistory();
    } else if (result.chatHistory && result.chatHistory.length > 0) {
      // Alte globale History vorhanden - frage ob migrieren
      if (confirm(getMessage('migrateChatHistory') || `Es wurde eine alte Chat-Historie gefunden. Möchtest du sie zu ${currentDomain} migrieren?`)) {
        chatHistory = result.chatHistory;
        // Speichere unter neuer Domain
        chrome.storage.local.set({ [chatKey]: chatHistory });
        // Lösche alte globale History
        chrome.storage.local.remove('chatHistory');
        displayChatHistory();
      }
    }
  });
  
  // Lade Seiteninhalte initial
  loadPageContent();
  
  // Prüfe auf pending Selection oder Screenshot
  chrome.storage.local.get(['pendingSelection', 'pendingScreenshot'], (result) => {
    if (result.pendingSelection) {
      addMessageToChat('system', `📍 ${getMessage('selectedText') || 'Markierter Text'}: "${result.pendingSelection}"`);
      chrome.storage.local.remove(['pendingSelection', 'selectionTimestamp']);
    }
    if (result.pendingScreenshot) {
      addScreenshotToChat(result.pendingScreenshot);
      chrome.storage.local.remove(['pendingScreenshot', 'screenshotTimestamp']);
    }
  });
  
  // Context Toggle
  contextToggle.addEventListener('click', () => {
    contextToggle.classList.toggle('active');
    contextContent.classList.toggle('active');
    
    // Speichere Zustand
    const isOpen = contextContent.classList.contains('active');
    chrome.storage.local.set({ contextOpen: isOpen });
    
    // Fokussiere Context Input wenn geöffnet
    if (isOpen) {
      setTimeout(() => contextInput.focus(), 300);
    }
  });
  
  // Lade gespeicherten Context Toggle Zustand
  chrome.storage.local.get(['contextOpen'], (result) => {
    if (result.contextOpen) {
      contextToggle.classList.add('active');
      contextContent.classList.add('active');
    }
  });
  
  // Open in Tab Button
  openInTabButton.addEventListener('click', async () => {
    // Speichere aktuellen Zustand
    const currentState = {
      chatHistory: chatHistory,
      currentDomain: currentDomain,
      currentPageData: currentPageData,
      context: contextInput.value
    };
    
    // Speichere Zustand für Tab
    await chrome.storage.local.set({ tabModeState: currentState });
    
    // Öffne in neuem Tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('claude-web-extension-tab.html')
    });
    
    // Optional: Schließe Popup
    window.close();
  });

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
    showSuccess(getMessage('successSettingsSaved'));
  });

  // Abbrechen
  cancelSettingsBtn.addEventListener('click', () => {
    applySettings(); // Setze UI zurück
    settingsPanel.classList.remove('active');
  });
  
  // Lizenz-Link
  licensesLink.addEventListener('click', (e) => {
    e.preventDefault();
    licenseModal.classList.add('active');
  });
  
  // Lizenz-Modal schließen
  closeLicenseModal.addEventListener('click', () => {
    licenseModal.classList.remove('active');
  });
  
  // Schließe Modal bei Klick außerhalb
  licenseModal.addEventListener('click', (e) => {
    if (e.target === licenseModal) {
      licenseModal.classList.remove('active');
    }
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
    deleteModal.classList.add('active');
  });
  
  // Bestätigung Löschen
  confirmDelete.addEventListener('click', () => {
    chatHistory = [];
    const chatKey = `chatHistory_${currentDomain}`;
    chrome.storage.local.remove(chatKey);
    while (chatContainer.firstChild) {
      chatContainer.removeChild(chatContainer.firstChild);
    }
    deleteModal.classList.remove('active');
    showSuccess(getMessage('chatDeleted') || 'Chat gelöscht!');
  });
  
  // Löschen abbrechen
  cancelDelete.addEventListener('click', () => {
    deleteModal.classList.remove('active');
  });
  
  // Schließe Modal bei Klick außerhalb
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      deleteModal.classList.remove('active');
    }
  });
  
  // Text markieren Button
  highlightTextBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Hole aktuelle Selection
    chrome.tabs.sendMessage(tab.id, { action: "getSelection" }, (response) => {
      if (response && response.hasSelection) {
        // Füge markierten Text zum Chat hinzu
        addMessageToChat('system', `📍 ${getMessage('selectedText') || 'Markierter Text'}: "${response.selectedText}"`);
        
        // Optional: Highlighte den Text auf der Seite
        chrome.tabs.sendMessage(tab.id, { action: "highlightSelection" });
      } else {
        showError(getMessage('noTextSelected') || 'Bitte markiere zuerst einen Text auf der Webseite');
      }
    });
  });
  
  // Screenshot aufnehmen Button
  captureScreenBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
      if (response && response.success) {
        addScreenshotToChat(response.dataUrl);
        showSuccess(getMessage('screenshotCaptured') || 'Screenshot aufgenommen!');
      } else {
        showError(getMessage('screenshotError') || 'Screenshot konnte nicht aufgenommen werden');
      }
    });
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
    let rawApiKey = document.getElementById('apiKey').value.trim();
    
    // Entferne alle unsichtbaren Zeichen
    rawApiKey = rawApiKey.replace(/[\s\u200B\u200C\u200D\uFEFF]/g, '');
    
    // Validiere API-Key Format (sk-ant-...)
    if (rawApiKey && !rawApiKey.startsWith('sk-ant-')) {
      // API-Key Format Warnung entfernt
    }
    
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
      // Settings gespeichert Debug-Log entfernt
      
      // Update Settings im Background Script (mit unverschlüsseltem Key)
      chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: { ...settings, apiKey: rawApiKey }
      }, (response) => {
        if (response && response.success) {
          // Settings erfolgreich übertragen Debug-Log entfernt
        }
      });
    });
    
    // Aktualisiere lokale settings mit unverschlüsseltem Key
    settings.apiKey = rawApiKey;
  }

  async function loadPageContent() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Prüfe ob es eine chrome:// oder andere geschützte URL ist
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://'))) {
        // Geschützte URL Debug-Log entfernt
        currentPageData = {
          url: tab.url,
          title: tab.title || 'Browser Page',
          bodyText: 'Diese Seite kann aus Sicherheitsgründen nicht analysiert werden.',
          timestamp: new Date().toISOString()
        };
        return;
      }
      
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
      // Fehler beim Laden der Seiteninhalte Debug-Log entfernt
      // Fallback für Fehler
      currentPageData = {
        url: 'unknown',
        title: 'Fehler beim Laden',
        bodyText: 'Die Seiteninhalte konnten nicht geladen werden.',
        timestamp: new Date().toISOString()
      };
    }
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Erlaube Demo-Modus ohne API Key
    if (!settings.apiKey) {
      // Fahre mit leerem Key fort - Backend handled Demo-Modus
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
      
      // Sende an Background Script mit entschlüsseltem Key
      const settingsToSend = { ...settings };
      
      // Debug-Ausgabe vor dem Senden entfernt
      
      chrome.runtime.sendMessage({
        action: 'sendChatMessage',
        message: message,
        context: contextInput.value.trim(),
        pageData: filteredPageData,
        chatHistory: chatHistory,
        settings: settingsToSend
      }, (response) => {
        // Entferne Lade-Animation
        loadingMessage.remove();
        
        if (response.error) {
          // Spezielle Behandlung für verschiedene Fehlertypen
          if (response.isRateLimit) {
            const waitMsg = response.waitTime 
              ? ` ${response.waitTime} ${response.waitTime === 1 ? getMessage('errorMinute') : getMessage('errorMinutes')}.`
              : '';
            showError(response.error + waitMsg);
            addMessageToChat('assistant', `⏱️ ${response.error}${waitMsg}`);
          } else if (response.isAuthError) {
            showError(response.error);
            addMessageToChat('assistant', `🔑 ${response.error}\n\n${getMessage('errorAuthKeyChat')}`);
            // Settings nicht automatisch öffnen - nur auf Benutzeraktion
          } else {
            showError(response.error);
            addMessageToChat('assistant', `❌ ${response.error}`);
          }
        } else if (response.reply) {
          addMessageToChat('assistant', response.reply);
        }
        
        sendButton.disabled = false;
        userInput.focus();
      });
    } catch (error) {
      loadingMessage.remove();
      showError(getMessage('errorSending'));
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

  function addMessageToChat(role, content, skipMarkdown = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (content.includes('<span class="loading">')) {
      // Lade-Animation sicher hinzufügen
      for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.className = 'loading';
        contentDiv.appendChild(span);
      }
    } else if (role === 'assistant' && markdownViewEnabled && typeof marked !== 'undefined' && !skipMarkdown) {
      // Render Markdown für Assistant-Nachrichten
      contentDiv.className = 'message-content markdown';
      contentDiv.innerHTML = marked.parse(content);
      
      // Syntax Highlighting wenn verfügbar
      if (typeof hljs !== 'undefined') {
        contentDiv.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      }
      
      // Öffne Links in neuem Tab
      contentDiv.querySelectorAll('a').forEach(link => {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      });
      
      // Füge View-Toggle hinzu
      if (role === 'assistant') {
        const viewToggle = createViewToggle(content, contentDiv);
        messageDiv.appendChild(viewToggle);
      }
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
      const chatKey = `chatHistory_${currentDomain}`;
      chrome.storage.local.set({ [chatKey]: chatHistory.slice(-50) }); // Behalte nur die letzten 50 Nachrichten pro Domain
    }
    
    return messageDiv;
  }
  
  function createViewToggle(originalContent, contentDiv) {
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'view-toggle';
    
    const markdownBtn = document.createElement('button');
    markdownBtn.textContent = 'MD';
    markdownBtn.className = 'active';
    markdownBtn.title = getMessage('viewMarkdown') || 'Markdown';
    
    const rawBtn = document.createElement('button');
    rawBtn.textContent = 'Raw';
    rawBtn.title = getMessage('viewRaw') || 'Raw';
    
    let isMarkdown = true;
    
    markdownBtn.addEventListener('click', () => {
      if (!isMarkdown) {
        isMarkdown = true;
        markdownBtn.classList.add('active');
        rawBtn.classList.remove('active');
        contentDiv.className = 'message-content markdown';
        contentDiv.innerHTML = marked.parse(originalContent);
        
        // Re-apply syntax highlighting
        if (typeof hljs !== 'undefined') {
          contentDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
          });
        }
        
        // Re-apply link targets
        contentDiv.querySelectorAll('a').forEach(link => {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        });
      }
    });
    
    rawBtn.addEventListener('click', () => {
      if (isMarkdown) {
        isMarkdown = false;
        rawBtn.classList.add('active');
        markdownBtn.classList.remove('active');
        contentDiv.className = 'message-content';
        contentDiv.textContent = originalContent;
      }
    });
    
    toggleDiv.appendChild(markdownBtn);
    toggleDiv.appendChild(rawBtn);
    
    return toggleDiv;
  }

  function displayChatHistory() {
    chatHistory.forEach(msg => {
      if (msg.screenshot) {
        // Spezielle Behandlung für Screenshots
        addScreenshotToChat(msg.screenshot, true); // skipHistory = true
      } else {
        // Normale Nachrichten - MIT Markdown für Assistant-Nachrichten
        addMessageToChat(msg.role, msg.content, false); // Markdown parsing aktiviert
      }
    });
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  function addScreenshotToChat(dataUrl, skipHistory = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.style.maxWidth = '90%';
    
    const label = document.createElement('p');
    label.textContent = `📸 ${getMessage('screenshotLabel') || 'Screenshot:'}`;
    label.style.margin = '0 0 10px 0';
    
    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.maxWidth = '100%';
    img.style.borderRadius = '8px';
    img.style.border = '1px solid #ddd';
    img.style.cursor = 'pointer';
    
    // Click to expand
    img.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '10000';
      
      const modalImg = document.createElement('img');
      modalImg.src = dataUrl;
      modalImg.style.maxWidth = '90%';
      modalImg.style.maxHeight = '90%';
      
      modal.appendChild(modalImg);
      modal.addEventListener('click', () => modal.remove());
      document.body.appendChild(modal);
    });
    
    contentDiv.appendChild(label);
    contentDiv.appendChild(img);
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    
    // Scroll zum Ende
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Speichere in History nur wenn nicht von History geladen
    if (!skipHistory) {
      chatHistory.push({ 
        role: 'system', 
        content: `[Screenshot: ${dataUrl.substring(0, 50)}...]`,
        screenshot: dataUrl 
      });
      const chatKey = `chatHistory_${currentDomain}`;
      chrome.storage.local.set({ [chatKey]: chatHistory.slice(-50) });
    }
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    statusDiv.replaceChildren(errorDiv);
    setTimeout(() => {
      statusDiv.replaceChildren();
    }, 5000);
  }

  function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    statusDiv.replaceChildren(successDiv);
    setTimeout(() => {
      statusDiv.replaceChildren();
    }, 3000);
  }
});