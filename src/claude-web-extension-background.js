// Background Service Worker
let ANTHROPIC_API_KEY = '';
let currentSettings = {
  claudeModel: 'claude-3-7-sonnet-20250219',
  maxTokens: 1024,
  temperature: 0.7
};

// Initialize Rate Limiter
const rateLimiter = new RateLimiter();
rateLimiter.initialize();

// Lade Settings beim Start
chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    currentSettings = result.settings;
    // Entschlüssele API-Key
    if (result.settings.apiKey) {
      try {
        ANTHROPIC_API_KEY = decryptApiKey(result.settings.apiKey);
        // API-Key erfolgreich geladen
      } catch (e) {
        console.error('Error decrypting API key:', e);
        ANTHROPIC_API_KEY = '';
      }
    } else {
      // Kein API-Key in Settings gefunden
    }
  }
});

// Handle Messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    currentSettings = request.settings;
    ANTHROPIC_API_KEY = request.settings.apiKey || '';
    sendResponse({ success: true });
  }
  
  if (request.action === 'sendChatMessage') {
    handleChatMessage(request, sendResponse);
    return true; // Wichtig für asynchrone Antwort
  }
  
  if (request.action === 'analyzeCurrent') {
    analyzeCurrentPage(sendResponse);
    return true;
  }
  
  if (request.action === 'captureScreenshot') {
    captureVisibleTab(sendResponse);
    return true;
  }
  
  if (request.action === 'updateContextMenu') {
    updateContextMenuForSelection(request.hasSelection, request.selectedText);
  }
});

// Demo-Modus Antworten
const DEMO_RESPONSES = [
  "Dies ist eine Demo-Antwort. Die Webseite '{title}' enthält interessante Informationen über verschiedene Themen.",
  "Demo-Analyse: Die Seite hat eine gute Struktur mit {links} Links und {images} Bildern.",
  "Im Demo-Modus kann ich zeigen, wie die Extension funktioniert. Für echte AI-Analysen benötigen Sie einen API-Key von console.anthropic.com",
  "Demo SEO-Check: Die Seite '{title}' hat Meta-Tags und scheint gut strukturiert zu sein.",
  "Dies ist eine Beispielantwort. Mit einem echten API-Key erhalten Sie detaillierte Analysen von Claude AI."
];

// Chat-Funktion
async function handleChatMessage(request, sendResponse) {
  let { message, context, pageData, chatHistory, settings } = request;
  
  // Verwende übergebene Settings oder Defaults
  const activeSettings = settings || currentSettings;
  const apiKey = activeSettings.apiKey || ANTHROPIC_API_KEY;
  
  // Debug-Ausgabe für API-Key Status entfernt
  
  // Demo-Modus wenn kein API Key
  if (!apiKey || apiKey === 'DEMO') {
    const demoResponse = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)]
      .replace('{title}', pageData?.title || 'Unbekannt')
      .replace('{links}', pageData?.links ? pageData.links.length : '0')
      .replace('{images}', pageData?.images ? pageData.images.length : '0');
    
    sendResponse({ 
      reply: `🎯 **${chrome.i18n.getMessage('demoModeTitle')}** 🎯\n\n${demoResponse}\n\n` +
             `ℹ️ ${chrome.i18n.getMessage('demoModeInfo')}`,
      isDemo: true 
    });
    return;
  }
  
  // Rate Limiting Check
  const rateCheck = rateLimiter.canMakeRequest();
  if (!rateCheck.allowed) {
    sendResponse({ 
      error: rateCheck.reason,
      waitTime: rateCheck.waitTime,
      isRateLimit: true
    });
    return;
  }
  
  try {
    // Null-Check für pageData
    if (!pageData) {
      pageData = {
        url: 'chrome://extensions',
        title: 'Chrome Extensions Page',
        bodyText: 'Cannot access chrome:// pages for security reasons'
      };
    }
    
    // Daten-Limits prüfen
    if (pageData.bodyText && pageData.bodyText.length > 100000) {
      pageData.bodyText = pageData.bodyText.substring(0, 100000) + '\n\n' + chrome.i18n.getMessage('textTruncated');
    }
    
    if (pageData.html && pageData.html.length > 50000) {
      pageData.html = pageData.html.substring(0, 50000) + '\n\n' + chrome.i18n.getMessage('htmlTruncated');
    }
    
    // Erstelle System-Prompt mit Kontext
    let systemPrompt = `Du bist ein hilfreicher Assistent, der Webseiten analysiert. 
Hier sind die Inhalte der aktuellen Webseite:

URL: ${pageData.url}
Titel: ${pageData.title}`;

    if (pageData.bodyText) {
      systemPrompt += `\n\nHauptinhalt:\n${pageData.bodyText}`;
    }
    
    if (pageData.links && pageData.links.length > 0) {
      systemPrompt += `\n\nLinks auf der Seite: ${pageData.links.length}`;
      // Zeige erste 10 Links
      const sampleLinks = pageData.links.slice(0, 10).map(l => `- ${l.text}: ${l.href}`).join('\n');
      systemPrompt += `\nBeispiele:\n${sampleLinks}`;
    }
    
    if (pageData.images && pageData.images.length > 0) {
      systemPrompt += `\n\nBilder auf der Seite: ${pageData.images.length}`;
      const sampleImages = pageData.images.slice(0, 5).map(img => `- ${img.alt || 'Kein Alt-Text'}: ${img.src}`).join('\n');
      systemPrompt += `\nBeispiele:\n${sampleImages}`;
    }
    
    if (pageData.meta) {
      systemPrompt += `\n\nMeta-Informationen:`;
      if (pageData.meta.description) systemPrompt += `\nBeschreibung: ${pageData.meta.description}`;
      if (pageData.meta.keywords) systemPrompt += `\nKeywords: ${pageData.meta.keywords}`;
      if (pageData.meta.author) systemPrompt += `\nAutor: ${pageData.meta.author}`;
    }
    
    if (pageData.html) {
      systemPrompt += `\n\nVollständiger HTML-Code verfügbar (${pageData.html.length} Zeichen)`;
    }

    if (context) {
      systemPrompt += `\n\nWICHTIG - Zusätzlicher Kontext vom Nutzer (BITTE BEACHTEN): ${context}`;
    }
    
    // Bereite Chat-History vor (ohne system message)
    const messages = [];
    
    // Füge relevante Chat-History hinzu (letzte 10 Nachrichten)
    const recentHistory = chatHistory.slice(-10);
    let lastRole = null;
    
    recentHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        // Verhindere doppelte user-Nachrichten hintereinander
        if (msg.role === 'user' && lastRole === 'user') {
          // Füge eine Dummy-Assistant-Nachricht ein
          messages.push({
            role: 'assistant',
            content: 'Ich verstehe.'
          });
        }
        messages.push({
          role: msg.role,
          content: msg.content
        });
        lastRole = msg.role;
      }
    });
    
    // Füge aktuelle Nachricht hinzu
    if (lastRole === 'user') {
      // Füge eine Dummy-Assistant-Nachricht ein wenn die letzte auch user war
      messages.push({
        role: 'assistant',
        content: 'Ich verstehe.'
      });
    }
    // Füge Kontext zur User Message hinzu wenn vorhanden
    let finalMessage = message;
    if (context) {
      finalMessage = `${message}\n\n[Kontext: ${context}]`;
    }
    messages.push({ role: 'user', content: finalMessage });
    
    // API-Aufruf mit system als separaten Parameter
    const requestBody = {
      model: activeSettings.claudeModel,
      system: systemPrompt,
      messages: messages,
      max_tokens: activeSettings.maxTokens,
      temperature: activeSettings.temperature
    };
    
    // API-Anfrage Debug-Log entfernt
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(requestBody)
    });
    
    // API Response Debug-Log entfernt
    
    // Rate Limit Request aufzeichnen
    rateLimiter.recordRequest();
    
    // Handle verschiedene Response Codes
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      sendResponse({ 
        error: chrome.i18n.getMessage('errorRateLimit'),
        waitTime: retryAfter ? parseInt(retryAfter) : 60,
        isRateLimit: true
      });
      return;
    }
    
    if (response.status === 401) {
      let errorDetails = {};
      try {
        errorDetails = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
      }
      // Authentication Error (401) Debug-Log entfernt
      sendResponse({ 
        error: chrome.i18n.getMessage('errorAuthKey'),
        isAuthError: true,
        details: errorDetails
      });
      return;
    }
    
    if (response.status === 400) {
      let errorDetails = {};
      try {
        errorDetails = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
      }
      // Bad Request Error (400) Debug-Log entfernt
      sendResponse({ 
        error: chrome.i18n.getMessage('errorBadRequest'),
        isBadRequest: true,
        details: errorDetails.error?.message || 'Bad request'
      });
      return;
    }
    
    // Log response status entfernt
    
    const data = await response.json();
    
    if (!response.ok) {
      // API Error Response Debug-Log entfernt
      throw new Error(data.error?.message || `API-Fehler: ${response.status}`);
    }
    
    const reply = data.content[0].text;
    sendResponse({ reply });
    
  } catch (error) {
    console.error('Error in handleChatMessage:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      apiKey: apiKey ? 'present' : 'missing',
      settings: activeSettings
    });
    
    // Nutzerfreundliche Fehlermeldungen
    let userMessage = chrome.i18n.getMessage('errorGeneral');
    
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      userMessage = chrome.i18n.getMessage('errorNetwork');
    } else if (error.message.includes('timeout')) {
      userMessage = chrome.i18n.getMessage('errorTimeout');
    } else if (error.message.includes('insufficient_quota')) {
      userMessage = chrome.i18n.getMessage('errorQuota');
    }
    
    sendResponse({ 
      error: userMessage,
      technicalError: error.message
    });
  }
}

// Analysiere aktuelle Seite (Legacy-Funktion)
async function analyzeCurrentPage(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Sende Nachricht an Content Script
    const pageData = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
    
    // Sende an Claude
    const analysis = await sendToClaude(pageData, "full");
    
    // Speichere Ergebnis
    chrome.storage.local.set({ 
      lastAnalysis: {
        url: pageData.url,
        response: analysis,
        timestamp: new Date().toISOString()
      },
      lastError: null
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error in analyzeCurrentPage:', error);
    chrome.storage.local.set({ 
      lastError: error.message,
      lastAnalysis: null
    });
    sendResponse({ error: error.message });
  }
}

// Sende an Claude API (Legacy-Funktion)
async function sendToClaude(pageData, type) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Kein API Key vorhanden');
  }
  
  let content = '';
  if (type === 'full') {
    content = `Analysiere diese Webseite:
URL: ${pageData.url}
Titel: ${pageData.title}
Inhalt: ${pageData.bodyText.substring(0, currentSettings.maxContentLength || 8000)}...`;
  } else if (type === 'selection') {
    content = `Analysiere diesen ausgewählten Text von ${pageData.url}:
"${pageData.selectedText}"`;
  }
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: currentSettings.claudeModel,
      messages: [{
        role: 'user',
        content: content
      }],
      max_tokens: currentSettings.maxTokens,
      temperature: currentSettings.temperature
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'API-Fehler');
  }
  
  return data.content[0].text;
}

// Screenshot Capture Funktion
async function captureVisibleTab(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Capture den sichtbaren Bereich
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 90
    });
    
    sendResponse({
      success: true,
      dataUrl: dataUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Kontext-Menü Update für Selection
function updateContextMenuForSelection(hasSelection, selectedText) {
  if (hasSelection) {
    chrome.contextMenus.update("analyzeWithClaude", {
      title: chrome.i18n.getMessage('contextMenuAnalyzeSelection') || `Analysiere: "${selectedText.substring(0, 20)}..."`
    });
  } else {
    chrome.contextMenus.update("analyzeWithClaude", {
      title: chrome.i18n.getMessage('contextMenuAnalyze')
    });
  }
}

// Erstelle Kontextmenü
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeWithClaude",
    title: chrome.i18n.getMessage('contextMenuAnalyze'),
    contexts: ["page", "selection"]
  });
  
  chrome.contextMenus.create({
    id: "captureAndAnalyze",
    title: chrome.i18n.getMessage('contextMenuCaptureAnalyze') || "Screenshot & Analysieren",
    contexts: ["page"]
  });
});

// Handle Kontextmenü-Klicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeWithClaude") {
    // Speichere Selection wenn vorhanden
    if (info.selectionText) {
      chrome.storage.local.set({ 
        pendingSelection: info.selectionText,
        selectionTimestamp: new Date().toISOString()
      });
    }
    // Öffne Popup
    chrome.action.openPopup();
  }
  
  if (info.menuItemId === "captureAndAnalyze") {
    // Capture Screenshot und öffne Popup
    captureAndOpenPopup();
  }
});

// Helper: Capture Screenshot und öffne Popup
async function captureAndOpenPopup() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 90
    });
    
    // Speichere Screenshot temporär
    chrome.storage.local.set({ 
      pendingScreenshot: dataUrl,
      screenshotTimestamp: new Date().toISOString()
    });
    
    // Öffne Popup
    chrome.action.openPopup();
  } catch (error) {
    console.error('Error in captureAndOpenPopup:', error);
  }
}