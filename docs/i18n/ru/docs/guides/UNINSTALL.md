# GateFlow — Uninstall Guide (Русский)

🌐 **Languages:** 🇺🇸 [English](../../../../docs/UNINSTALL.md) · 🇸🇦 [ar](../../ar/docs/UNINSTALL.md) · 🇧🇬 [bg](../../bg/docs/UNINSTALL.md) · 🇧🇩 [bn](../../bn/docs/UNINSTALL.md) · 🇨🇿 [cs](../../cs/docs/UNINSTALL.md) · 🇩🇰 [da](../../da/docs/UNINSTALL.md) · 🇩🇪 [de](../../de/docs/UNINSTALL.md) · 🇪🇸 [es](../../es/docs/UNINSTALL.md) · 🇮🇷 [fa](../../fa/docs/UNINSTALL.md) · 🇫🇮 [fi](../../fi/docs/UNINSTALL.md) · 🇫🇷 [fr](../../fr/docs/UNINSTALL.md) · 🇮🇳 [gu](../../gu/docs/UNINSTALL.md) · 🇮🇱 [he](../../he/docs/UNINSTALL.md) · 🇮🇳 [hi](../../hi/docs/UNINSTALL.md) · 🇭🇺 [hu](../../hu/docs/UNINSTALL.md) · 🇮🇩 [id](../../id/docs/UNINSTALL.md) · 🇮🇹 [it](../../it/docs/UNINSTALL.md) · 🇯🇵 [ja](../../ja/docs/UNINSTALL.md) · 🇰🇷 [ko](../../ko/docs/UNINSTALL.md) · 🇮🇳 [mr](../../mr/docs/UNINSTALL.md) · 🇲🇾 [ms](../../ms/docs/UNINSTALL.md) · 🇳🇱 [nl](../../nl/docs/UNINSTALL.md) · 🇳🇴 [no](../../no/docs/UNINSTALL.md) · 🇵🇭 [phi](../../phi/docs/UNINSTALL.md) · 🇵🇱 [pl](../../pl/docs/UNINSTALL.md) · 🇵🇹 [pt](../../pt/docs/UNINSTALL.md) · 🇧🇷 [pt-BR](../../pt-BR/docs/UNINSTALL.md) · 🇷🇴 [ro](../../ro/docs/UNINSTALL.md) · 🇷🇺 [ru](../../ru/docs/UNINSTALL.md) · 🇸🇰 [sk](../../sk/docs/UNINSTALL.md) · 🇸🇪 [sv](../../sv/docs/UNINSTALL.md) · 🇰🇪 [sw](../../sw/docs/UNINSTALL.md) · 🇮🇳 [ta](../../ta/docs/UNINSTALL.md) · 🇮🇳 [te](../../te/docs/UNINSTALL.md) · 🇹🇭 [th](../../th/docs/UNINSTALL.md) · 🇹🇷 [tr](../../tr/docs/UNINSTALL.md) · 🇺🇦 [uk-UA](../../uk-UA/docs/UNINSTALL.md) · 🇵🇰 [ur](../../ur/docs/UNINSTALL.md) · 🇻🇳 [vi](../../vi/docs/UNINSTALL.md) · 🇨🇳 [zh-CN](../../zh-CN/docs/UNINSTALL.md)

---

This guide covers how to cleanly remove GateFlow from your system.

---

## Quick Uninstall (v3.6.2+)

GateFlow provides two built-in scripts for clean removal:

### Keep Your Data

```bash
npm run uninstall
```

This removes the GateFlow application but **preserves** your database, configurations, API keys, and provider settings in `~/.GateFlow/`. Use this if you plan to reinstall later and want to keep your setup.

### Full Removal

```bash
npm run uninstall:full
```

This removes the application **and permanently erases** all data:

- Database (`storage.sqlite`)
- Provider configurations and API keys
- Backup files
- Log files
- All files in the `~/.GateFlow/` directory

> ⚠️ **Warning:** `npm run uninstall:full` is irreversible. All your provider connections, combos, API keys, and usage history will be permanently deleted.

---

## Manual Uninstall

### NPM Global Install

```bash
# Remove the global package
npm uninstall -g GateFlow

# (Optional) Remove data directory
rm -rf ~/.GateFlow
```

### pnpm Global Install

```bash
pnpm uninstall -g GateFlow
rm -rf ~/.GateFlow
```

### Docker

```bash
# Stop and remove the container
docker stop GateFlow
docker rm GateFlow

# Remove the volume (deletes all data)
docker volume rm GateFlow-data

# (Optional) Remove the image
docker rmi diegosouzapw/GateFlow:latest
```

### Docker Compose

```bash
# Stop and remove containers
docker compose down

# Also remove volumes (deletes all data)
docker compose down -v
```

### Electron Desktop App

**Windows:**

- Open `Settings → Apps → GateFlow → Uninstall`
- Or run the NSIS uninstaller from the install directory

**macOS:**

- Drag `GateFlow.app` from `/Applications` to Trash
- Remove data: `rm -rf ~/Library/Application Support/GateFlow`

**Linux:**

- Remove the AppImage file
- Remove data: `rm -rf ~/.GateFlow`

### Source Install (git clone)

```bash
# Remove the cloned directory
rm -rf /path/to/GateFlow

# (Optional) Remove data directory
rm -rf ~/.GateFlow
```

---

## Data Directories

GateFlow stores data in the following locations by default:

| Platform      | Default Path                  | Override                  |
| ------------- | ----------------------------- | ------------------------- |
| Linux         | `~/.GateFlow/`               | `DATA_DIR` env var        |
| macOS         | `~/.GateFlow/`               | `DATA_DIR` env var        |
| Windows       | `%APPDATA%/GateFlow/`        | `DATA_DIR` env var        |
| Docker        | `/app/data/` (mounted volume) | `DATA_DIR` env var        |
| XDG-compliant | `$XDG_CONFIG_HOME/GateFlow/` | `XDG_CONFIG_HOME` env var |

### Files in the data directory

| File/Directory       | Description                                       |
| -------------------- | ------------------------------------------------- |
| `storage.sqlite`     | Main database (providers, combos, settings, keys) |
| `storage.sqlite-wal` | SQLite write-ahead log (temporary)                |
| `storage.sqlite-shm` | SQLite shared memory (temporary)                  |
| `call_logs/`         | Request payload archives                          |
| `backups/`           | Automatic database backups                        |
| `log.txt`            | Legacy request log (optional)                     |

---

## Verify Complete Removal

After uninstalling, verify there are no remaining files:

```bash
# Check for global npm package
npm list -g GateFlow 2>/dev/null

# Check for data directory
ls -la ~/.GateFlow/ 2>/dev/null

# Check for running processes
pgrep -f GateFlow
```

If any process is still running, stop it:

```bash
pkill -f GateFlow
```
