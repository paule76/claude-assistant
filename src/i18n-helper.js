// i18n Helper Functions
function initializeI18n() {
  // Replace all data-i18n attributes with localized text
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        // For input elements, set placeholder
        if (element.hasAttribute('placeholder')) {
          element.placeholder = message;
        }
      } else if (element.tagName === 'OPTION') {
        // For option elements, set text content
        element.textContent = message;
      } else {
        // For other elements, set text content
        element.textContent = message;
      }
    }
  });
  
  // Replace all data-i18n-title attributes with localized tooltips
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n-title');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.title = message;
    }
  });
  
  // Special handling for elements with HTML content
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n-html');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.innerHTML = message;
    }
  });
}

// Helper to get localized message in JS
function getMessage(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeI18n);
} else {
  initializeI18n();
}