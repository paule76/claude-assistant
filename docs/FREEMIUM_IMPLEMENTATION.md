# Freemium-Modell Implementierung

## Problem: Reinstallations-Missbrauch verhindern

### Option 1: Device Fingerprinting (Empfohlen) 🎯
```javascript
// Erstelle eindeutigen Device-Fingerprint
async function getDeviceFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Claude Web Analyzer', 2, 2);
  const canvasData = canvas.toDataURL();
  
  // Kombiniere mit anderen Faktoren
  const fingerprint = {
    canvas: canvasData,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    // Hardware Concurrency
    cores: navigator.hardwareConcurrency,
    // WebGL Renderer
    gpu: getWebGLRenderer()
  };
  
  // Hash zu eindeutiger ID
  const hash = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(JSON.stringify(fingerprint))
  );
  
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getWebGLRenderer() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
}
```

### Option 2: Browser-ID + Installation Time 📅
```javascript
// Generiere Browser-Installation-ID einmalig
async function getBrowserId() {
  let { browserId } = await chrome.storage.local.get('browserId');
  
  if (!browserId) {
    // Erste Installation
    browserId = crypto.randomUUID();
    const installTime = Date.now();
    
    await chrome.storage.local.set({ 
      browserId, 
      installTime,
      freeUsesResetTime: installTime 
    });
  }
  
  return browserId;
}

// Server-Seite: Track by Browser-ID
app.post('/api/check-limit', async (req, res) => {
  const { browserId, deviceFingerprint } = req.body;
  
  // Prüfe beide IDs
  const usage = await db.getUsage(browserId, deviceFingerprint);
  
  if (usage.isNewDevice && usage.hasSuspiciousPattern) {
    // Möglicher Missbrauch
    return res.json({ 
      allowed: false, 
      reason: 'device_limit_reached' 
    });
  }
  
  return res.json({ 
    allowed: usage.dailyCount < FREE_LIMIT,
    remaining: FREE_LIMIT - usage.dailyCount
  });
});
```

### Option 3: Google Account Integration 🔐
```javascript
// Nutze Chrome Identity API
chrome.identity.getAuthToken({ interactive: true }, function(token) {
  if (chrome.runtime.lastError) {
    // User nicht eingeloggt
    showLimitedMode();
    return;
  }
  
  // Verifiziere mit Google
  fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(response => response.json())
  .then(userInfo => {
    // Nutze Google ID für Limits
    checkUserLimits(userInfo.id);
  });
});

// Manifest.json additions:
{
  "permissions": ["identity"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["openid", "email"]
  }
}
```

### Option 4: Hybrid-Ansatz (Beste Lösung) 🏆

```javascript
class FreemiumManager {
  constructor() {
    this.FREE_DAILY_LIMIT = 10;
    this.RESET_HOUR = 0; // Mitternacht UTC
  }
  
  async checkLimit() {
    // 1. Device Fingerprint
    const fingerprint = await this.getDeviceFingerprint();
    
    // 2. Local Storage Check
    const localUsage = await this.getLocalUsage();
    
    // 3. Server Validation
    const serverCheck = await this.validateWithServer(fingerprint, localUsage);
    
    // 4. Anti-Abuse Checks
    if (this.detectAbusePattern(localUsage, serverCheck)) {
      return { 
        allowed: false, 
        message: "Unusual activity detected. Please try again later." 
      };
    }
    
    return serverCheck;
  }
  
  detectAbusePattern(local, server) {
    // Mehrere Reinstallationen in kurzer Zeit?
    if (local.installTime && Date.now() - local.installTime < 3600000) { // 1 Stunde
      if (server.recentInstalls > 3) return true;
    }
    
    // Verdächtige Usage Patterns
    if (server.avgRequestInterval < 1000) return true; // Zu schnelle Requests
    
    return false;
  }
  
  async getLocalUsage() {
    const data = await chrome.storage.local.get([
      'dailyUsage', 
      'lastResetDate', 
      'installTime',
      'deviceId'
    ]);
    
    // Reset wenn neuer Tag
    const today = new Date().toDateString();
    if (data.lastResetDate !== today) {
      await chrome.storage.local.set({
        dailyUsage: 0,
        lastResetDate: today
      });
      data.dailyUsage = 0;
    }
    
    return data;
  }
  
  async trackUsage() {
    const { dailyUsage = 0 } = await chrome.storage.local.get('dailyUsage');
    await chrome.storage.local.set({ 
      dailyUsage: dailyUsage + 1,
      lastUsed: Date.now()
    });
  }
}
```

## Server-Implementierung (Node.js/Express)

```javascript
const rateLimit = require('express-rate-limit');
const MongoClient = require('mongodb').MongoClient;

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Max 100 requests per IP
  message: 'Too many requests'
});

// Datenbank Schema
const UserUsageSchema = {
  deviceFingerprint: String,
  browserId: String,
  ipAddress: String,
  dailyUsage: Number,
  totalUsage: Number,
  firstSeen: Date,
  lastSeen: Date,
  installCount: Number, // Wie oft neu installiert
  suspiciousActivity: Boolean
};

app.post('/api/check-usage', limiter, async (req, res) => {
  const { 
    deviceFingerprint, 
    browserId, 
    localUsage 
  } = req.body;
  
  const ipAddress = req.ip;
  
  try {
    // Finde oder erstelle User
    let user = await db.collection('users').findOne({
      $or: [
        { deviceFingerprint },
        { browserId },
        { ipAddress }
      ]
    });
    
    if (!user) {
      // Neuer User
      user = await createNewUser(deviceFingerprint, browserId, ipAddress);
    } else {
      // Check für Reinstallation
      if (user.browserId !== browserId) {
        user.installCount += 1;
        user.lastInstall = new Date();
        
        // Missbrauch?
        if (user.installCount > 5) {
          user.suspiciousActivity = true;
        }
      }
    }
    
    // Prüfe Tageslimit
    const today = new Date().toDateString();
    if (user.lastUsageDate !== today) {
      user.dailyUsage = 0;
      user.lastUsageDate = today;
    }
    
    const allowed = !user.suspiciousActivity && 
                   user.dailyUsage < FREE_DAILY_LIMIT;
    
    res.json({
      allowed,
      remaining: Math.max(0, FREE_DAILY_LIMIT - user.dailyUsage),
      resetTime: getNextResetTime(),
      upgradeUrl: allowed ? null : 'https://your-site.com/upgrade'
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

## Client-Implementierung in Extension

```javascript
// background.js Addition
class FreemiumService {
  constructor() {
    this.SERVER_URL = 'https://your-api.com';
    this.cache = new Map();
  }
  
  async canMakeRequest() {
    // Cache für 5 Minuten
    const cached = this.cache.get('usage');
    if (cached && Date.now() - cached.time < 300000) {
      return cached.data;
    }
    
    const fingerprint = await getDeviceFingerprint();
    const { browserId } = await chrome.storage.local.get('browserId');
    
    try {
      const response = await fetch(`${this.SERVER_URL}/api/check-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deviceFingerprint: fingerprint,
          browserId: browserId || 'unknown'
        })
      });
      
      const data = await response.json();
      this.cache.set('usage', { data, time: Date.now() });
      
      return data;
    } catch (error) {
      // Offline? Erlaube begrenzt
      return { allowed: true, remaining: 3, offline: true };
    }
  }
  
  async makeRequest(pageData, message) {
    const usage = await this.canMakeRequest();
    
    if (!usage.allowed) {
      return {
        error: 'Tageslimit erreicht',
        upgradeUrl: usage.upgradeUrl,
        resetTime: usage.resetTime
      };
    }
    
    // Mache Request über Proxy
    const response = await fetch(`${this.SERVER_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageData, message })
    });
    
    // Update local usage
    await this.incrementLocalUsage();
    
    return response.json();
  }
}
```

## Empfohlene Strategie

### Phase 1: Einfaches Limit (Sofort)
- Local Storage only
- Device Fingerprint
- 10 Anfragen/Tag
- Reset um Mitternacht

### Phase 2: Server-Validierung
- Proxy-Server aufsetzen
- IP + Fingerprint Tracking
- Missbrauchs-Erkennung

### Phase 3: Premium-Features
- Stripe/PayPal Integration
- Unlimited für zahlende User
- BYOK Option behalten

## Kosten-Kalkulation

```
Free Users: 10 requests/day
Claude API Cost: ~$0.001-0.01 per request
Max Cost per User: $0.10/day

Bei 1000 free users: $100/Tag Maximum
Realistisch (20% usage): $20/Tag

Premium: $4.99/Monat
Break-even: ~150 zahlende User
```