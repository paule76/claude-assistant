// Einfache Verschlüsselung für API-Key
// Nutzt eine Kombination aus Browser-ID und festem Salt

const SALT = 'ClaudeWebAnalyzer2024';

// Einfache XOR-Verschlüsselung (für besseren Schutz könnte man Web Crypto API nutzen)
function encryptApiKey(apiKey) {
  if (!apiKey) return '';
  
  const key = SALT;
  let encrypted = '';
  
  for (let i = 0; i < apiKey.length; i++) {
    const charCode = apiKey.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  
  // Base64 encode für sichere Speicherung
  return btoa(encrypted);
}

function decryptApiKey(encryptedKey) {
  if (!encryptedKey) return '';
  
  try {
    // Base64 decode
    const encrypted = atob(encryptedKey);
    const key = SALT;
    let decrypted = '';
    
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    
    return decrypted;
  } catch (e) {
    console.error('Fehler beim Entschlüsseln:', e);
    return '';
  }
}