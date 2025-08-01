# Claude Assistant

<p align="center">
  <img src="src/icon128-new.png" alt="Claude Assistant Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Your AI assistant for any webpage - powered by Claude</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#setup">Setup</a> •
  <a href="#demo-mode">Demo Mode</a> •
  <a href="#privacy">Privacy</a>
</p>

<p align="center">
  <a href="README_DE.md">🇩🇪 Deutsche Version</a>
</p>

## 🚀 Features

- 💬 **Smart Chat Interface** - Interactive AI assistant for any webpage
- 🌐 **Domain-Specific Chats** - Separate conversation history per website
- 📝 **Markdown Support** - Rich text formatting with syntax highlighting
- 📸 **Text & Screenshot Capture** - Highlight text or capture visual content
- 🤖 **Multiple Claude Models** - Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5, and Haiku 3.5
- 🔒 **Secure API Storage** - Encrypted API key with Chrome Sync
- 🎯 **Demo Mode** - Try without API key
- 📦 **4 Size Options** - S/M/L/XL popup sizes
- 🆕 **Tab Mode** - Open chat in full browser tab
- 🌍 **Multi-Language** - English and German (Deutsch)
- ⚙️ **Customizable** - Control what webpage data gets analyzed
- 🔐 **Privacy First** - Your data stays local

## 📦 Installation

### Option 1: Chrome Web Store
*Coming soon!*

### Option 2: Manual Installation

1. Clone the repository:
```bash
git clone git@github.com:paule76/claude-assistant.git
cd claude-assistant
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked"

5. Select the `src/` folder

## 🔧 Setup

### With Your Own API Key (Recommended)

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Click the extension icon
3. Open settings (⚙️)
4. Enter your API key and save

### Demo Mode

- Leave the API key field empty
- The extension will show demo responses
- Perfect for testing functionality

## 💡 Use Cases

- **SEO Analysis** - Check meta tags, structure, and optimizations
- **Content Summarization** - Summarize long articles
- **Code Review** - Analyze webpage code
- **Accessibility** - Check accessibility aspects
- **Security Analysis** - Find potential issues

## 🛡️ Privacy

- **No Data Collection** - We don't collect usage data
- **Encrypted Storage** - API keys are encrypted
- **Local Processing** - Chat history stays on your device
- **Open Source** - Code is fully transparent

See our [Privacy Policy](PRIVACY.md)

## ⚙️ Configuration

### Available Models

| Model | Description | Use Case |
|-------|-------------|----------|
| Claude Opus 4 | Most powerful | Complex analyses |
| Claude Sonnet 4 | Balanced | General use |
| Claude Sonnet 3.7 | Recommended (Default) | Best balance |
| Claude Haiku 3.5 | Fast & affordable | Simple queries |

### Settings

- **Page Content**: Choose which elements to analyze
- **Max Text Length**: Limit large pages (Default: 100KB)
- **Response Length**: Control answer length
- **Temperature**: Response creativity (0-1)

## 📊 Costs

The extension is **free**. You only pay for your API usage at Anthropic:

- Claude Haiku 3.5: ~$0.001 per request
- Claude Sonnet 3.7: ~$0.003-0.015 per request  
- Claude Opus 4: ~$0.015-0.075 per request

## 🤝 Contributing

Contributions are welcome! Please create an issue or pull request.

### Development

```bash
# Clone repository
git clone https://github.com/paule76/claude-web-analyzer.git

# Change to src directory
cd claude-web-analyzer/src

# Make changes and test
# Reload extension in Chrome after changes
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Credits

- Developed with ❤️ by [S.Paul](https://github.com/paule76)
- Powered by [Claude AI](https://anthropic.com) from Anthropic

## 🙏 Special Thanks

**A HUGE thank you to Claude Code for being an incredible development partner!** 🎉

This extension was built in an amazing 6-hour coding session with Claude Code, who helped with:
- 🏗️ Architecture design and implementation
- 🐛 Bug fixes and optimizations  
- 🎨 UI/UX improvements
- 🌍 Internationalization (i18n)
- 💡 Countless brilliant ideas and solutions!

Built with [Claude Code](https://github.com/anthropics/claude-code) 🤖✨

## 📞 Support

- 🐛 Report bugs: [GitHub Issues](https://github.com/paule76/claude-assistant/issues)
- 💡 Feature requests: [GitHub Issues](https://github.com/paule76/claude-assistant/issues)

---

<p align="center">
  <strong>⭐ If you like this extension, please star it! ⭐</strong>
</p>