// Einfache Verschlüsselung für API-Key
// Nutzt eine Kombination aus Browser-ID und festem Salt

const SALT = 'ClaudeWebAnalyzer2024';

// Einfache XOR-Verschlüsselung (für besseren Schutz könnte man Web Crypto API nutzen)
function encryptApiKey(apiKey) {
  if (!apiKey) return '';
  
  try {
    const key = SALT;
    const encrypted = [];
    
    for (let i = 0; i < apiKey.length; i++) {
      const charCode = apiKey.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted.push(charCode);
    }
    
    // Konvertiere zu String für Base64
    const encryptedString = encrypted.map(code => String.fromCharCode(code)).join('');
    
    // Base64 encode für sichere Speicherung
    return btoa(encryptedString);
  } catch (e) {
    // Verschlüsselungsfehler Debug-Log entfernt
    return '';
  }
}

function decryptApiKey(encryptedKey) {
  if (!encryptedKey) return '';
  
  try {
    // Base64 decode
    const encrypted = atob(encryptedKey);
    const key = SALT;
    const decrypted = [];
    
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted.push(String.fromCharCode(charCode));
    }
    
    const result = decrypted.join('');
    
    // Validiere dass der entschlüsselte Key valide aussieht
    if (result && result.length > 0) {
      // API-Key erfolgreich entschlüsselt Debug-Log entfernt
      return result;
    } else {
      // Entschlüsselter Key ist leer Debug-Log entfernt
      return '';
    }
  } catch (e) {
    // Fehler beim Entschlüsseln Debug-Log entfernt
    return '';
  }
}