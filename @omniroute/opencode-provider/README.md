# @GateFlow/opencode-provider

Provider plugin for connecting [OpenCode](https://github.com/anomalyco/opencode) to [GateFlow](https://github.com/diegosouzapw/GateFlow).

## Installation

```bash
npm install @GateFlow/opencode-provider
```

## Usage

```javascript
import { createGateFlowProvider } from "@GateFlow/opencode-provider";

const provider = createGateFlowProvider({
  baseURL: "http://localhost:20128/v1",
  apiKey: "your-GateFlow-api-key",
});
```

Then configure OpenCode to use the provider:

```jsonc
// OpenCode settings
{
  "provider": provider
}
```

## API

### `createGateFlowProvider(options)`

Creates an OpenCode-compatible provider object that routes requests through GateFlow.

**Options:**

| Option    | Type     | Required | Description                                                |
| --------- | -------- | -------- | ---------------------------------------------------------- |
| `baseURL` | `string` | Yes      | GateFlow API base URL (e.g., `http://localhost:20128/v1`) |
| `apiKey`  | `string` | Yes      | GateFlow API key                                          |
| `model`   | `string` | No       | Model identifier (default: `"opencode"`)                   |

**Returns:** An OpenCode-compatible provider object with `id`, `name`, `npm`, `options`, and `auth` fields.
