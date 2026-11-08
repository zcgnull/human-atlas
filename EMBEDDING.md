# Embedding and agent control

The viewer exposes a small, versioned command surface that agents and host systems can drive: zoom, focus, standard views, layer visibility, explode level, sex switch, search, and state reads. The visible UI, the optional WebMCP browser tools, and the embed bridge all execute through the same command registry (`app/commands.ts`), so automation and manual use behave identically.

```
Browser agent (WebMCP)  ── app/agent-tools.ts ─┐
Host page (postMessage) ── app/embed-bridge.ts ┼──► command invoker ──► React state + camera handle ──► 3D scene
Host SDK (HumanAtlas)   ── public/embed/…  ────┘            │
                                                             └──► state / ready events back to the host
```

## Quick start (iframe + SDK)

Host the viewer anywhere (it is a static site), then embed it and talk to it:

```html
<iframe id="atlas" title="Human Atlas"></iframe>
<script src="https://your-viewer.example/embed/human-atlas-sdk.js"></script>
<script>
  const iframe = document.getElementById('atlas');
  // embedUrl appends ?embed=1&allowOrigin=<this page's origin>
  iframe.src = HumanAtlas.embedUrl('https://your-viewer.example/', location.origin);
  const atlas = HumanAtlas.connect(iframe, {origin: 'https://your-viewer.example/'});
  atlas.on('state', snapshot => console.log(snapshot.scene.visible));
  atlas.ready.then(() => atlas.call('atlas_focus', {id: 'heart', mode: 'isolate'}));
</script>
```

`HumanAtlas.connect` returns `{call, on, ready, close}`:

- `call(tool, args)` → `Promise` resolving with the tool result, rejecting with an `Error` on validation or execution failure (15 s default timeout, configurable).
- `on('state' | 'ready', callback)` → unsubscribe function. `state` events are throttled (~120 ms trailing) and carry a full snapshot, so hosts never merge deltas.
- `ready` → promise that resolves when the viewer's atlas catalogue has loaded.

Try it locally: run the viewer (`npm run dev`, port 3016), then serve `examples/` on another port (`npx serve examples -l 8080` or `python -m http.server 8080 -d examples`) and open `http://localhost:8080/embed-host.html`.

## Tools

| Tool | Arguments | Effect |
| --- | --- | --- |
| `atlas_find` | `query: string` | Search names and source identifiers; returns up to 30 matches with ids. |
| `atlas_get_state` | — | Full snapshot: sex, scene state, atlas counts, capabilities, tool manifest. |
| `atlas_inspect` | `id: string` | Select a concept (or part) and open its detail panel. |
| `atlas_focus` | `id: string`, `mode?: 'frame' \| 'isolate'` | `frame`: keep everything visible, move the camera onto the structure. `isolate`: hide everything else and frame it (same as the UI's isolate). |
| `atlas_reset` | — | Reset layers, selection, explode, and view for the current sex. |
| `visibility_set` | `operation: 'set' \| 'add' \| 'remove' \| 'toggle'`, `systems: SystemId[]` | Layer control. Result lists the new visible set and any systems absent from the current atlas. |
| `structure_hide` | `id?: string`, `restore?: boolean` | Hide or restore individual structures within the visible layers. No arguments hides the current selection (the UI's "Hide from model"); `restore:true` with `id` brings one structure back, `restore:true` alone brings every hidden structure back. Layer changes and `atlas_reset` also restore hidden structures. |
| `camera_zoom` | `by?: number` (factor, 0.1–10) or `to?: number` (0 whole body … 1 close) | Smooth zoom. Provide exactly one. |
| `camera_set_view` | `view: 'three-quarter' \| 'front' \| 'side' \| 'back'` | Standard views (matches the UI buttons). |
| `camera_rotate` | `on: boolean` | Auto-rotation; rejected while the anatomy is separated (explode ≥ 0.4). |
| `explode_set` | `level: number` (0–1) | Separation amount; above 0.8 switches to the front inventory view. |
| `body_set_sex` | `sex: 'male' \| 'female' \| 'skin'` | Swap the anatomy catalogue (male BodyParts3D, female Human Reference Atlas, or the original schematic skin cross-section); scene state resets. |
| `supply_collect` | `id?: string`, `kinds?: ('vascular' \| 'neural')[]` | Fold the vessels and nerves that reach a structure (or the current selection) into the selection. Proximity-based: bounding boxes with a 4% envelope margin, so a vessel merely passing nearby may be included. |
| `sim_set_heartbeat` | `on: boolean` | Illustrative heartbeat: a light pulse leaves the heart each beat, travels the arteries, veins glow back. Not a simulation of flow. |
| `scene_capture_image` | `scale?: 1–3` | Capture the 3D view (no panels) as a PNG data URL — lets a backend or agent verify what a command actually changed. |
| `ui_set_locale` | `locale: 'en' \| 'zh'` | Switch the viewer interface language. Interface text and structure display names localize (Chinese uses a compositional translator with graceful English fallback); protocol fields — ids, `atlas_find` results, error messages — stay in the source language so agent behavior is stable. |

All arguments are JSON objects validated against the schema in each tool's manifest (see `atlas_get_state` → `tools`). Failures throw/reject with a human-readable message instead of a code. System ids come from `app/anatomy.ts` (`skeletal`, `muscular`, `cardiac`, `arterial`, `venous`, `nervous`, `respiratory`, `digestive`, `urinary`, `lymphatic`, `endocrine`, `reproductive`, `integumentary`, `sensory`, `connective`, `pregnancy`); not every sex has every system. System names in the snapshot are localized to the viewer's current language; tool names, schemas, and error messages stay English so agent behavior is stable across languages.

The viewer also accepts a `?lang=en|zh` URL parameter to pin the initial language (higher priority than the saved preference and browser language), and persists a manual choice in `localStorage`.

### Snapshot shape

```jsonc
// atlas_get_state result / 'state' and 'ready' event payload
{
  "version": 1,
  "capabilities": ["atlas", "scene", "camera", "ui"],
  "locale": "en",
  "sex": "male",
  "progress": 100,
  "error": null,
  "atlas": { "parts": 2234, "concepts": 3432, "triangles": 2288268,
             "systems": [{"id": "skeletal", "name": "Skeleton", "count": 206}] },
  "scene": { "explode": 0, "visible": ["skeletal"], "selected": ["..."],
             "isolate": false, "view": "front", "rotate": false, "reset": 3 },
  "tools": [ { "name": "camera_zoom", "description": "…", "inputSchema": { … } } ]
}
```

`capabilities` is the forward-compat knob: newer viewers may grow sections (for example per-structure paint channels or timed simulations) and will advertise them here; hosts should treat unknown sections as ignorable.

## Raw postMessage protocol

The SDK is a convenience; the wire protocol is three message shapes, all stamped `{v: 1, channel: 'atlas'}`:

```
host → viewer   {v, channel, type: 'request', id, tool, args}          // id: string|number
viewer → host   {v, channel, type: 'response', id, ok: true, result}
viewer → host   {v, channel, type: 'response', id, ok: false, error}
viewer → host   {v, channel, type: 'event', event: 'ready'|'state', payload}
```

The bridge activates only when the viewer URL contains `?embed=1`. Requests are accepted only from the parent window whose origin is listed in `&allowOrigin=` (comma-separated; `*` allows any origin — development only). With `embed=1` but no `allowOrigin`, only same-origin parents are accepted. Arguments are schema-validated inside the viewer; there is no path that evaluates host-provided code.

## Driving the viewer from a backend

Browsers cannot be reached directly from a server; the host page relays. A typical loop:

```
agent / business logic → backend (any language) → WebSocket or SSE ↓
host page JS → HumanAtlas.call(...) → viewer
viewer 'state' events → host page → WebSocket ↑ → backend
```

Minimal Python relay (FastAPI) that fans tool calls down and snapshots back up:

```python
import asyncio, json
from fastapi import FastAPI, WebSocket

app = FastAPI()
clients: set[WebSocket] = set()

@app.websocket("/atlas/ws")
async def atlas_ws(ws: WebSocket):
    await ws.accept(); clients.add(ws)
    try:
        while True:                       # host page sends viewer state events here
            snapshot = json.loads(await ws.receive_text())
            # ...store latest snapshot, feed your agent loop...
    finally:
        clients.discard(ws)

async def broadcast_tool(tool: str, args: dict):
    for ws in clients:                    # host page listens and calls HumanAtlas
        await ws.send_text(json.dumps({"tool": tool, "args": args}))
```

The host page then forwards `{"tool", "args"}` messages to `atlas.call(...)` and pushes every `state` event back through the socket. Because the viewer keeps its own animation and the host relays only goal-state commands, latency requirements are mild.

## Extending

Adding a capability is three small edits, with no protocol break:

1. **Command** — append a `ToolDefinition` and a handler in `app/commands.ts` (names are `<group>_<action>`: `atlas_*`, `visibility_*`, `camera_*`, `explode_*`, `body_*`, later e.g. `paint_*`, `sim_*`). WebMCP registration and the embed manifest pick it up automatically.
2. **Renderer** — new state fields extend `SceneState` in `app/anatomy.ts` and are consumed in `app/scene.tsx`'s per-frame diff; purely imperative effects (like the camera goals) go through a handle registered with `onReady`.
3. **Capabilities** — extend `ATLAS_CAPABILITIES` and add a namespaced section to the snapshot when the feature has observable state. Adding a language means adding a dictionary to `app/i18n.ts` (`LOCALES` picks it up; the type and contract tests enforce full message coverage).

Keep contract tests for new tools in `scripts/validate-interactions.mjs` — it executes every tool against a fake controller and asserts state transitions.
