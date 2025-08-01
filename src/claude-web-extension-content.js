// Content Script - läuft auf jeder Webseite
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    // Sammle alle relevanten Seiteninformationen
    const pageData = {
      url: window.location.href,
      title: document.title,
      // Hauptinhalt extrahieren
      bodyText: document.body.innerText,
      // Optional: HTML für strukturierte Daten
      html: document.documentElement.outerHTML,
      // Meta-Informationen
      meta: {
        description: document.querySelector('meta[name="description"]')?.content || '',
        keywords: document.querySelector('meta[name="keywords"]')?.content || '',
        author: document.querySelector('meta[name="author"]')?.content || ''
      },
      // Sammle alle Links
      links: Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText,
        href: a.href
      })).filter(link => link.href),
      // Sammle Bilder (optional)
      images: Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt
      })),
      // Zeitstempel
      timestamp: new Date().toISOString()
    };
    
    sendResponse(pageData);
  }
  
  if (request.action === "getSelection") {
    // Nur ausgewählten Text senden
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    sendResponse({
      url: window.location.href,
      title: document.title,
      selectedText: selectedText,
      hasSelection: selectedText.length > 0,
      context: selectedText ? getSelectionContext(selection) : null,
      timestamp: new Date().toISOString()
    });
  }
  
  if (request.action === "highlightSelection") {
    highlightSelectedText();
    sendResponse({ success: true });
  }
  
  return true; // Wichtig für asynchrone Antworten
});

// Helper-Funktion: Hole Kontext um die Selection
function getSelectionContext(selection) {
  if (!selection.rangeCount) return null;
  
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const parentElement = container.nodeType === Node.TEXT_NODE 
    ? container.parentElement 
    : container;
  
  // Hole umgebenden Text für besseren Kontext
  const contextLength = 50;
  const fullText = parentElement.textContent || '';
  const selectedText = selection.toString();
  const startIndex = fullText.indexOf(selectedText);
  
  if (startIndex === -1) return null;
  
  const contextStart = Math.max(0, startIndex - contextLength);
  const contextEnd = Math.min(fullText.length, startIndex + selectedText.length + contextLength);
  
  return {
    before: fullText.substring(contextStart, startIndex),
    selected: selectedText,
    after: fullText.substring(startIndex + selectedText.length, contextEnd),
    elementType: parentElement.tagName?.toLowerCase()
  };
}

// Helper-Funktion: Markiere selektierten Text visuell
function highlightSelectedText() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const span = document.createElement('span');
  span.className = 'claude-highlight';
  span.style.backgroundColor = '#ffeb3b';
  span.style.color = '#000';
  span.style.padding = '2px';
  span.style.borderRadius = '3px';
  
  try {
    range.surroundContents(span);
  } catch (e) {
    // Fallback für komplexere Selections
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }
  
  selection.removeAllRanges();
}

// Event Listener für Kontext-Menü
document.addEventListener('contextmenu', (e) => {
  const selection = window.getSelection();
  const selectedText = selection ? selection.toString().trim() : '';
  
  if (selectedText) {
    chrome.runtime.sendMessage({
      action: 'updateContextMenu',
      hasSelection: true,
      selectedText: selectedText
    });
  }
});