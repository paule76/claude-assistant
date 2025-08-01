// Background Service Worker
let ANTHROPIC_API_KEY = '';
let currentSettings = {
  claudeModel: 'claude-3-7-sonnet-20250219',
  maxTokens: 1024,
  temperature: 0.7
};

// Lade Settings beim Start
chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    currentSettings = result.settings;
    // Entschlüssele API-Key
    ANTHROPIC_API_KEY = result.settings.apiKey ? decryptApiKey(result.settings.apiKey) : '';
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
});

// Chat-Funktion
async function handleChatMessage(request, sendResponse) {
  const { message, context, pageData, chatHistory, settings } = request;
  
  // Verwende übergebene Settings oder Defaults
  const activeSettings = settings || currentSettings;
  const apiKey = activeSettings.apiKey || ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    sendResponse({ error: 'Kein API Key gespeichert' });
    return;
  }
  
  try {
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
      systemPrompt += `\n\nZusätzlicher Kontext vom Nutzer: ${context}`;
    }
    
    // Bereite Chat-History vor
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Füge relevante Chat-History hinzu (letzte 10 Nachrichten)
    const recentHistory = chatHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });
    
    // Füge aktuelle Nachricht hinzu
    messages.push({ role: 'user', content: message });
    
    // API-Aufruf
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: activeSettings.claudeModel,
        messages: messages,
        max_tokens: activeSettings.maxTokens,
        temperature: activeSettings.temperature
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API-Fehler');
    }
    
    const reply = data.content[0].text;
    sendResponse({ reply });
    
  } catch (error) {
    console.error('Fehler beim API-Aufruf:', error);
    sendResponse({ error: error.message });
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
      'anthropic-version': '2023-06-01'
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

// Erstelle Kontextmenü
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeWithClaude",
    title: "Mit Claude analysieren",
    contexts: ["page", "selection"]
  });
});

// Handle Kontextmenü-Klicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeWithClaude") {
    // Öffne Popup
    chrome.action.openPopup();
  }
});