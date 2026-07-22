---
description: Deploy the latest GateFlow code to BOTH the Akamai VPS and the Local VPS
---

# Deploy to VPS (Both) Workflow

Deploy GateFlow to the production VPSs using `npm pack + scp` + PM2.

**Akamai VPS:** `69.164.221.35`
**Local VPS:** `192.168.0.15`
**Process manager:** PM2 (`GateFlow`)
**Port:** `20128`
**PM2 entry:** `/usr/lib/node_modules/GateFlow/app/server.js`

> [!IMPORTANT]
> The npm registry rejects packages > 100MB, so deployment uses **npm pack + scp**.

## Steps

### 1. Build + pack locally

// turbo

```bash
cd /home/diegosouzapw/dev/proxys/GateFlow && rm -f GateFlow-*.tgz && rm -rf .next/cache app/.next/cache && npm run build:cli && rm -rf app/logs app/coverage app/.git app/.app-build-backup* && npm pack --ignore-scripts
```

### 2. Copy to both VPS and install

// turbo-all

```bash
scp GateFlow-*.tgz root@69.164.221.35:/tmp/ && scp GateFlow-*.tgz root@192.168.0.15:/tmp/
```

```bash
ssh root@69.164.221.35 "npm install -g /tmp/GateFlow-*.tgz --ignore-scripts && cd /usr/lib/node_modules/GateFlow/app && npm rebuild better-sqlite3 && pm2 delete GateFlow 2>/dev/null; pm2 start /root/.GateFlow/ecosystem.config.cjs --update-env && pm2 save && echo '✅ Akamai done'"
```

```bash
ssh root@192.168.0.15 "npm install -g /tmp/GateFlow-*.tgz --ignore-scripts && cd /usr/lib/node_modules/GateFlow/app && npm rebuild better-sqlite3 && pm2 delete GateFlow 2>/dev/null; pm2 start /root/.GateFlow/ecosystem.config.cjs --update-env && pm2 save && echo '✅ Local done'"
```

### 3. Verify the deployment

```bash
curl -s -o /dev/null -w 'AKAMAI HTTP %{http_code}\n' http://69.164.221.35:20128/
curl -s -o /dev/null -w 'LOCAL HTTP %{http_code}\n' http://192.168.0.15:20128/
```
