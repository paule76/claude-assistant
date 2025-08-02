# Changelog

All notable changes to Claude Assistant will be documented in this file.

## [3.7.1] - 2025-01-02

### Fixed
- 🐛 TypeError when reassigning pageData constant - Fixed const declaration issue
- 📝 Updated all repository references from claude-web-analyzer to claude-assistant
- 🖼️ Added Chrome Web Store formatted screenshots (1280x800)

## [3.7.0] - 2025-01-02

### Added
- 🔍 Comprehensive error logging throughout the extension for better debugging
- 📑 Tab mode implementation - Chat now properly loads when opened in full tab
- 🔧 Console.error logging in all catch blocks

### Fixed
- 🐛 Tab mode not loading chat history from popup mode
- 📁 Missing claude-web-extension-tab.js implementation
- 🔄 Chat history now properly transfers between popup and tab mode

### Changed
- 📝 Renamed tab-js.js to tab.js for consistency

## [3.6.0] - 2024-12-29

### Changed
- 🎨 **Renamed to Claude Assistant** - New, cleaner name (previously Claude Web Analyzer)
- 📍 **Moved size buttons** - Now in header next to Tab/Settings buttons
- 🗑️ **Improved delete dialog** - Beautiful modal instead of browser confirm()

### Added  
- 📱 **Responsive button text** - Icons only on S/M sizes, text+icons on L/XL
- 💬 **Delete confirmation modal** - Prevents accidental chat deletion
- 🌐 **Better tooltips** - All buttons now have helpful hover text

### Fixed
- 🐛 Button overlap issues at different sizes
- 🎯 Size selector positioning conflicts

## [3.5.0] - 2024-12-29

### Added
- 📏 **Size selector buttons** (S/M/L/XL) - Replace problematic drag-resize
- 🆕 **"Open in Tab" button** - Full browser tab mode for extended chats
- 🗑️ **Trash icon** for clear chat button

### Fixed
- 🔧 Layout responsiveness at different window sizes
- 🐛 Content not adapting to window size changes

## [3.4.0] - 2024-12-29

### Added
- 📂 **Collapsible context field** - Save space with toggle functionality
- 🔄 **Resizable popup** - Drag corner to resize (400x400 to 800x800px)
- 💾 **Size persistence** - Window size saved between sessions

## [3.3.0] - 2024-12-29

### Added
- 🌐 **Domain-specific chats** - Separate chat history per website
- 🔄 **Chat migration** - Option to migrate old global chats to domains
- 📍 **Domain display** - Current domain shown prominently

## [3.2.0] - 2024-12-29

### Added
- 📝 **Text highlighting** - Select and highlight text on webpage
- 📸 **Screenshot capture** - Capture visible area of webpage
- 🎯 **Hybrid capture** - Smart text/screenshot selection

### Fixed
- 🐛 Markdown formatting lost on chat reload

## [3.1.0] - 2024-12-29

### Added
- 📝 **Markdown rendering** - Rich text formatting for Claude's responses
- 🎨 **Syntax highlighting** - Code blocks with highlight.js
- 🔄 **View toggle** - Switch between Markdown and raw text
- 📚 **Local libraries** - marked.js and highlight.js included

## [3.0.0] - 2024-12-28

### Added
- 🌍 **Full internationalization** - English and German support
- 🎯 **Demo mode** - Try without API key
- 🔐 **XOR encryption** - Enhanced API key security
- ⏱️ **Rate limiting** - Smart request throttling

### Changed
- 🏗️ Complete architecture rewrite
- 🎨 New modern UI design
- 📱 Improved responsive layout

## [2.0.0] - 2024-12-27

### Added
- 💬 **Chat interface** - Interactive conversation with Claude
- 🤖 **Multiple models** - Support for Opus, Sonnet, Haiku
- ⚙️ **Settings panel** - Customizable options
- 📊 **Content filtering** - Choose what data to analyze

## [1.0.0] - 2024-12-26

### Initial Release
- 🚀 Basic webpage analysis
- 🔑 API key support
- 📄 Text extraction