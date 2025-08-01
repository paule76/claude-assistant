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
    const selectedText = window.getSelection().toString();
    sendResponse({
      url: window.location.href,
      title: document.title,
      selectedText: selectedText,
      timestamp: new Date().toISOString()
    });
  }
  
  return true; // Wichtig für asynchrone Antworten
});