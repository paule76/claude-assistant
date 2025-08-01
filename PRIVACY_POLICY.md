# Privacy Policy for Claude Web Analyzer

**Last Updated: February 2025**

## Overview

Claude Web Analyzer is a Chrome extension that allows users to analyze web content using Claude AI by Anthropic. This privacy policy explains how we handle your data.

## Data Collection and Usage

### 1. Web Page Content
- **What we collect**: When you use the extension, it reads the content of the current webpage including:
  - Page text content
  - Page title and URL
  - Links on the page (optional)
  - Image information (optional)
  - Meta tags (optional)
  - Full HTML code (optional - based on your settings)
  
- **How we use it**: This content is sent to Anthropic's Claude API for analysis based on your queries. We do not store webpage content permanently.

### 2. API Key Storage
- **What we collect**: Your Anthropic API key (required for the service to function)
- **How we store it**: 
  - API keys are encrypted using XOR encryption before storage
  - Stored in Chrome's sync storage (chrome.storage.sync)
  - Synced across your devices when signed into Chrome
  - Never transmitted anywhere except to Anthropic's API
- **Security**: Keys are never stored in plain text and are only decrypted when needed for API calls

### 3. Chat History
- **What we collect**: Your conversation history with Claude
- **How we store it**: 
  - Stored locally in your browser (chrome.storage.local)
  - Limited to the last 50 messages
  - Not synced between devices
  - Can be cleared at any time using the "Clear Chat" button

### 4. Extension Settings
- **What we collect**: Your preferences including:
  - Selected Claude model
  - Content inclusion preferences
  - Maximum content length
  - Response settings (temperature, max tokens)
- **How we store it**: In Chrome's sync storage, synchronized across your devices

## Third-Party Services

### Anthropic API
- Web content and your queries are sent to Anthropic's Claude API
- This is necessary for the AI analysis functionality
- Anthropic's privacy policy applies to data sent to their service
- Learn more at: https://www.anthropic.com/privacy

## Data Sharing
- **We do NOT**:
  - Share your data with any third parties (except Anthropic for API functionality)
  - Sell your data
  - Use your data for advertising
  - Track your browsing history
  - Collect analytics

## Data Retention
- **API Keys**: Retained until you remove them or uninstall the extension
- **Chat History**: Retained locally until cleared or extension is uninstalled
- **Settings**: Retained until changed or extension is uninstalled
- **Web Content**: Not retained - only temporarily processed for API requests

## Your Rights
You have the right to:
- View all stored data in Chrome's extension storage
- Delete your chat history at any time
- Remove your API key at any time
- Uninstall the extension, which removes all local data
- Disable Chrome sync to prevent cross-device synchronization

## Security Measures
- API keys are encrypted before storage
- All communication with Anthropic uses HTTPS
- No data is stored on external servers (only Chrome storage)
- Extension uses minimal required permissions

## Updates
This privacy policy may be updated to reflect changes in the extension. Updates will be noted with a new "Last Updated" date.

## Contact
For questions about this privacy policy or the extension:
- GitHub: https://github.com/paulstefan/claude-web-analyzer
- Create an issue on the GitHub repository

## Compliance
This extension is designed to comply with:
- Chrome Web Store policies
- GDPR principles (user control, data minimization, purpose limitation)
- General data protection best practices

By using Claude Web Analyzer, you agree to this privacy policy and the processing of your data as described above.