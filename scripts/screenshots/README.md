# UI screenshots

The screenshots under `static/img/frontend-ui/` show the Jaeger UI on the
Features page and on a few other pages. Each view exists as a light capture
(`<name>.png`) and a dark capture (`<name>-dark.png`); the `screenshot`
shortcode in `layouts/_shortcodes/screenshot.html` emits both, and the
stylesheet shows the one that matches the site's color mode.

`capture.mjs` in this directory takes the captures with Playwright, which the
repository already has as a dev dependency. Every capture is a 1600 px wide
viewport screenshot; two are cropped at the bottom because the page has empty
space below its content. The script does not start Jaeger: it photographs
whatever runs at `JAEGER_URL` (default `http://localhost:16686`), so the
stacks below are started by hand, one at a time, because all of them publish
Jaeger on port 16686.

```bash
npm install
npx playwright install chromium
node scripts/screenshots/capture.mjs <capture> [<capture> ...]
```

## Stacks and captures

The captures use the HotROD demo application as the traced system, so the
service names in the images are the familiar `frontend`, `customer`, `driver`,
`route`, `mysql` and `redis-manual`.

### Goose stack: search, trace, graphs, assistant

`scripts/ai-sidecar/goose/run.sh` in the `jaeger` repository starts Jaeger
with the AI assistant backed by Goose and a model from OpenRouter
(`OPENROUTER_API_KEY` or `SECRET_RESOLVER_CMD` must be set; see the script's
header). With `--release` it runs the released Jaeger image, which is what the
captures of the released UI should show; without it, it runs a build of that
working tree, which the `genai-trace` capture needs, because the released image
does not yet trace its own assistant turns. It sends traces from microsim, whose traces all root at
`test-executor: runTest` and carry errors, so HotROD replaces it:

```bash
./scripts/ai-sidecar/goose/run.sh --release        # from the jaeger repository; without --release for genai-trace
docker stop goose-microsim-1
docker restart goose-jaeger-1                      # empties the in-memory store
docker run -d --rm --name hotrod --network goose_default \
  -e OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318 \
  jaegertracing/example-hotrod:latest all
docker run --rm --network goose_default curlimages/curl:latest sh -c \
  'for c in 123 392 731 567 123 392 731 567 123 392 731 567 123 392 731 567; do
     curl -s -o /dev/null "http://hotrod:8080/dispatch?customer=$c&nonse=$RANDOM"; sleep 1; done'
```

Then, from this repository:

| Capture | Needs |
| --- | --- |
| `search-results` | nothing more |
| `system-architecture` | nothing more |
| `deep-dependency-graph` | nothing more |
| `trace-timeline` | `TRACE_ID`, the ID of one HotROD trace (any row of the search results) |
| `ai-assistant` | the assistant answering; the capture asks the question itself and waits for the answer |
| `genai-trace` | `GENAI_TRACE_ID`, the ID of a trace of the assistant's own turn: search for service `jaeger` and operation `/api/ai/chat`; the `ai-assistant` capture produces one |

Stop the stack with `./scripts/ai-sidecar/goose/run.sh --down` and
`docker stop hotrod`.

### SPM stack: the Monitor tab

`docker-compose/monitor/docker-compose.yml` in the `jaeger` repository runs
Jaeger with Prometheus and microsim. The Monitor tab needs about fifteen minutes
of traffic before its charts fill. The `spm` capture selects the `redis`
service, whose error rate is neither zero nor pegged at the top, and the last
fifteen minutes. Pull the Jaeger image first, since a cached `latest` can be
months old.

```bash
docker compose -f docker-compose/monitor/docker-compose.yml pull jaeger
docker compose -f docker-compose/monitor/docker-compose.yml up -d
node scripts/screenshots/capture.mjs spm      # after fifteen minutes, from this repository
docker compose -f docker-compose/monitor/docker-compose.yml down
```

### Grafana plugin stack: embedded mode

The `grafana-plugin` repository's `docker-compose.yaml` (`make server`) runs
Grafana with the Jaeger panel plugin, a Jaeger instance and HotROD, and
provisions a dashboard that takes the service and the trace ID as URL
variables. Generate a few requests against `http://localhost:8080/dispatch`,
take a trace ID from the Jaeger search, and run the `grafana-embedded` capture
with it in `TRACE_ID`. The capture sets Grafana's theme through the URL and
hides its navigation menu; the Jaeger panel follows Grafana's theme.

## Details worth knowing

- Jaeger UI reads its color mode from the `jaeger-ui-theme` key in
  localStorage, holding the JSON string `"light"` or `"dark"`; the script sets
  it before each page loads.
- The span side panel is an option in the trace view settings menu (the gear
  in the trace header); the script switches it on. The GenAI tab in the span
  details appears on spans that carry `gen_ai.*` attributes.
- The Deep Dependency Graph is the search page with `view=ddg` plus a time
  range, so the script clicks the button rather than building the URL.
- In the assistant panel the Send button stays disabled while the input is
  empty, so the script detects the end of an answer by the panel text no
  longer changing.
- Keep every image under 300 KB; a 1600 by 1000 PNG of these views lands
  between 60 KB and 270 KB.
