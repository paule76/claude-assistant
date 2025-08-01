// Tab Mode Script - Erweiterte Version des Popup Scripts
let chatHistory = [];
let currentPageData = null;
let currentDomain = null;
let markdownViewEnabled = true;
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
    breaks: true,
    gfm: true,
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

document.addEventListener('DOMContentLoaded', async () => {
  const contextInput = document.getElementById('context');
  const userInput = document.getElementById('userInput');
  const sendButton = document.getElementById('sendButton');
  const clearButton = document.getElementById('clearButton');
  const chatContainer = document.getElementById('chatContainer');
  const domainInfo = document.getElementById('domainInfo');
  const pageInfo = document.getElementById('pageInfo');
  const settingsButton = document.getElementById('settingsButton');
  const highlightTextBtn = document.getElementById('highlightTextBtn');
  const captureScreenBtn = document.getElementById('captureScreenBtn');
  
  // Lade gespeicherte Settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (result.settings) {
      settings = { ...settings, ...result.settings };
      // Entschlüssele API-Key
      if (settings.apiKey) {
        settings.apiKey = decryptApiKey(settings.apiKey);
      }
    }
  });
  
  // Lade den gespeicherten Tab-Modus Zustand
  chrome.storage.local.get(['tabModeState'], async (result) => {
    if (result.tabModeState) {
      const state = result.tabModeState;
      
      // Stelle den Zustand wieder her
      chatHistory = state.chatHistory || [];
      currentDomain = state.currentDomain || 'unknown';
      currentPageData = state.currentPageData || null;
      
      // Setze Context
      if (state.context) {
        contextInput.value = state.context;
      }
      
      // Zeige Domain Info
      domainInfo.textContent = `- ${currentDomain}`;
      
      // Zeige Page Info
      if (currentPageData) {
        pageInfo.innerHTML = `<strong>${currentDomain}</strong><br>${currentPageData.title || currentPageData.url}`;
      }
      
      // Zeige Chat History
      displayChatHistory();
      
      // Optional: Lösche den temporären Zustand nach dem Laden
      // chrome.storage.local.remove('tabModeState');
    } else {
      // Kein gespeicherter Zustand - starte mit leerem Chat
      domainInfo.textContent = '- Neuer Chat';
      pageInfo.innerHTML = '<em>Kein Tab-Kontext verfügbar</em>';
    }
  });
  
  // Settings Button
  settingsButton.addEventListener('click', () => {
    // Öffne die Options-Seite in einem neuen Tab
    chrome.runtime.openOptionsPage();
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
    if (confirm(getMessage('confirmClearChat') || 'Möchtest du den Chat wirklich löschen?')) {
      chatHistory = [];
      // Lösche auch aus Storage wenn Domain vorhanden
      if (currentDomain && currentDomain !== 'unknown') {
        const chatKey = `chatHistory_${currentDomain}`;
        chrome.storage.local.remove(chatKey);
      }
      // Leere Chat Container
      while (chatContainer.firstChild) {
        chatContainer.removeChild(chatContainer.firstChild);
      }
      showSuccess(getMessage('chatDeleted') || 'Chat gelöscht!');
    }
  });
  
  // Text markieren Button
  highlightTextBtn.addEventListener('click', async () => {
    // Im Tab-Modus müssen wir den ursprünglichen Tab finden
    const tabs = await chrome.tabs.query({});
    const originalTab = tabs.find(tab => 
      tab.url && getDomainFromUrl(tab.url) === currentDomain && 
      !tab.url.includes('claude-web-extension-tab.html')
    );
    
    if (originalTab) {
      // Wechsle zum Original-Tab
      await chrome.tabs.update(originalTab.id, { active: true });
      
      // Hole aktuelle Selection
      chrome.tabs.sendMessage(originalTab.id, { action: "getSelection" }, (response) => {
        if (response && response.hasSelection) {
          addMessageToChat('system', `📍 ${getMessage('selectedText') || 'Markierter Text'}: "${response.selectedText}"`);
          chrome.tabs.sendMessage(originalTab.id, { action: "highlightSelection" });
          // Wechsle zurück zum Extension Tab
          chrome.tabs.getCurrent((currentTab) => {
            chrome.tabs.update(currentTab.id, { active: true });
          });
        } else {
          showError(getMessage('noTextSelected') || 'Bitte markiere zuerst einen Text auf der Webseite');
        }
      });
    } else {
      showError('Original-Tab nicht gefunden. Bitte öffne die Webseite erneut.');
    }
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
  
  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
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
        // Check for runtime errors
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          loadingMessage.remove();
          showError('Verbindungsfehler zur Extension');
          sendButton.disabled = false;
          return;
        }
        
        // Entferne Lade-Animation
        loadingMessage.remove();
        
        if (response.error) {
          if (response.isRateLimit) {
            const waitMsg = response.waitTime 
              ? ` ${response.waitTime} ${response.waitTime === 1 ? getMessage('errorMinute') : getMessage('errorMinutes')}.`
              : '';
            showError(response.error + waitMsg);
            addMessageToChat('assistant', `⏱️ ${response.error}${waitMsg}`);
          } else if (response.isAuthError) {
            showError(response.error);
            addMessageToChat('assistant', `🔑 ${response.error}\n\n${getMessage('errorAuthKeyChat')}`);
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
      console.error('Error sending message:', error);
      loadingMessage.remove();
      showError(getMessage('errorSending') + ' (Details in Console)');
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
    
    if (settings.includeText && pageData.bodyText) {
      filtered.bodyText = pageData.bodyText.substring(0, settings.maxContentLength);
    }
    
    if (settings.includeLinks && pageData.links) {
      filtered.links = pageData.links;
    }
    
    if (settings.includeImages && pageData.images) {
      filtered.images = pageData.images;
    }
    
    if (settings.includeMeta && pageData.meta) {
      filtered.meta = pageData.meta;
    }
    
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
      // Lade-Animation
      for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.className = 'loading';
        contentDiv.appendChild(span);
      }
    } else if (role === 'assistant' && markdownViewEnabled && typeof marked !== 'undefined' && !skipMarkdown) {
      // Render Markdown
      contentDiv.className = 'message-content markdown';
      contentDiv.innerHTML = marked.parse(content);
      
      // Syntax Highlighting
      if (typeof hljs !== 'undefined') {
        contentDiv.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      }
      
      // Links in neuem Tab öffnen
      contentDiv.querySelectorAll('a').forEach(link => {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      });
      
      // View Toggle hinzufügen
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
    
    // Speichere in History
    if (!content.includes('loading')) {
      chatHistory.push({ role, content });
      // Speichere auch im Storage wenn Domain vorhanden
      if (currentDomain && currentDomain !== 'unknown') {
        const chatKey = `chatHistory_${currentDomain}`;
        chrome.storage.local.set({ [chatKey]: chatHistory.slice(-50) });
      }
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
        
        if (typeof hljs !== 'undefined') {
          contentDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
          });
        }
        
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
        // Screenshots
        addScreenshotToChat(msg.screenshot, true);
      } else {
        // Normale Nachrichten - MIT Markdown für Assistant
        addMessageToChat(msg.role, msg.content, false);
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
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    if (!skipHistory) {
      chatHistory.push({ 
        role: 'system', 
        content: `[Screenshot: ${dataUrl.substring(0, 50)}...]`,
        screenshot: dataUrl 
      });
      
      if (currentDomain && currentDomain !== 'unknown') {
        const chatKey = `chatHistory_${currentDomain}`;
        chrome.storage.local.set({ [chatKey]: chatHistory.slice(-50) });
      }
    }
  }
  
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.background = '#f44336';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '15px 20px';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    errorDiv.style.zIndex = '10000';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
  
  function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.background = '#4CAF50';
    successDiv.style.color = 'white';
    successDiv.style.padding = '15px 20px';
    successDiv.style.borderRadius = '4px';
    successDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    successDiv.style.zIndex = '10000';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  }
  
  function getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return 'unknown';
    }
  }
});