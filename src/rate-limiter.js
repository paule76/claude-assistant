// Rate Limiter für API-Anfragen
class RateLimiter {
  constructor() {
    this.requests = [];
    this.MAX_REQUESTS_PER_MINUTE = 10;
    this.MAX_REQUESTS_PER_HOUR = 100;
  }

  canMakeRequest() {
    const now = Date.now();
    
    // Bereinige alte Einträge
    this.requests = this.requests.filter(timestamp => {
      return now - timestamp < 3600000; // Behalte nur letzte Stunde
    });
    
    // Prüfe Minuten-Limit
    const lastMinute = this.requests.filter(t => now - t < 60000);
    if (lastMinute.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return {
        allowed: false,
        reason: 'Zu viele Anfragen. Bitte warte 1 Minute.',
        waitTime: 60 - Math.floor((now - lastMinute[0]) / 1000)
      };
    }
    
    // Prüfe Stunden-Limit
    if (this.requests.length >= this.MAX_REQUESTS_PER_HOUR) {
      const oldestRequest = Math.min(...this.requests);
      return {
        allowed: false,
        reason: 'Stündliches Limit erreicht. Bitte später versuchen.',
        waitTime: Math.ceil((3600000 - (now - oldestRequest)) / 60000)
      };
    }
    
    return { allowed: true };
  }

  recordRequest() {
    this.requests.push(Date.now());
    // Speichere in Storage für Persistenz
    chrome.storage.local.set({ 
      rateLimiterRequests: this.requests 
    });
  }

  async initialize() {
    // Lade gespeicherte Requests
    const data = await chrome.storage.local.get('rateLimiterRequests');
    if (data.rateLimiterRequests) {
      this.requests = data.rateLimiterRequests;
    }
  }
}

// Export für Service Worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RateLimiter;
}