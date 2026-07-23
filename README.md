<div align="center">

# 🚀 GateFlow

### Unified AI Gateway — Route any LLM through one endpoint

**160+ Providers** • **13 Routing Strategies** • **MCP Server** • **A2A Protocol**

[![npm](https://img.shields.io/npm/v/GateFlow?logo=npm&style=flat-square)](https://www.npmjs.com/package/GateFlow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.22.2-brightgreen?style=flat-square)](package.json)
[![Stars](https://img.shields.io/github/stars/ghstouch/GateFlow?style=social)](https://github.com/ghstouch/GateFlow)

</div>

---

## ✨ Features

- 🔀 **Smart Routing** — 13 strategies (priority, weighted, round-robin, cost-optimized, etc.)
- 🤖 **160+ Providers** — OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral, and more
- 💰 **Cost Savings** — Auto-fallback to free/low-cost models
- 🗜️ **Prompt Compression** — Save 15-95% tokens with RTK + Caveman engines
- 🔧 **MCP Server** — 37 tools for model management
- 🤝 **A2A Protocol** — Agent-to-Agent communication
- 🖥️ **Multi-Platform** — Web, Desktop (Electron), Mobile (PWA)

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g GateFlow

# Start server
GateFlow

# Open dashboard
open http://localhost:20128
```

---

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/v1/chat/completions` | Chat completions (OpenAI-compatible) |
| `/v1/models` | List available models |
| `/v1/embeddings` | Text embeddings |
| `/v1/images/generations` | Image generation |
| `/v1/audio/transcriptions` | Audio transcription |
| `/v1/audio/speech` | Text-to-speech |

---

## 🔧 Configuration

Set your API keys in the dashboard or via environment variables:

```bash
export OPENAI_API_KEY=sk-xxx
export ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## 📖 Documentation

- [Full Documentation](https://github.com/ghstouch/GateFlow/tree/main/docs)
- [API Reference](https://github.com/ghstouch/GateFlow/blob/main/docs/reference/API_REFERENCE.md)
- [Provider Guide](https://github.com/ghstouch/GateFlow/blob/main/docs/reference/PROVIDER_REFERENCE.md)

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**[GitHub](https://github.com/ghstouch/GateFlow)** • **[npm](https://www.npmjs.com/package/GateFlow)** • **[Docker](https://hub.docker.com/r/ghstouch/GateFlow)**

</div>
