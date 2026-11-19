#!/usr/bin/env bash
# Smoke test for deploy/otel/collector.yaml. Needs Docker. Run from anywhere.
set -euo pipefail

IMAGE="otel/opentelemetry-collector-contrib:0.165.0"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF="$HERE/../collector.yaml"
WORK="$(mktemp -d)"
NAME="otel-smoke-$$"
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT
mkdir -p "$WORK/out" "$WORK/storage"

[ -f "$CONF" ] || { echo "FAIL: $CONF missing"; exit 1; }
ENVS=(-e O2_OTLP_ENDPOINT=http://127.0.0.1:1 -e O2_AUTH=ZHVtbXk6ZHVtbXk=)

echo "== validate collector.yaml alone"
docker run --rm --user "$(id -u)" "${ENVS[@]}" -v "$CONF:/etc/otel/collector.yaml:ro" \
  "$IMAGE" validate --config /etc/otel/collector.yaml

echo "== run against fixtures"
docker run -d --name "$NAME" --user "$(id -u)" "${ENVS[@]}" \
  -v "$CONF:/etc/otel/collector.yaml:ro" -v "$HERE/overlay.yaml:/etc/otel/overlay.yaml:ro" \
  -v "$HERE/fixtures/docker/containers:/var/lib/docker/containers:ro" \
  -v "$HERE/fixtures/nginx:/var/log/nginx:ro" \
  -v "$WORK/out:/out" -v "$WORK/storage:/var/lib/otelcol/storage" \
  "$IMAGE" --config /etc/otel/collector.yaml --config /etc/otel/overlay.yaml >/dev/null
sleep 10
docker stop -t 10 "$NAME" >/dev/null
docker logs "$NAME" 2>&1 | grep -P '\t(error|warn)\t' || true

OUT="$WORK/out" python3 - <<'PY'
import json, os, sys, glob
out = os.environ["OUT"]
fails = []
def check(ok, msg):
    print(("PASS: " if ok else "FAIL: ") + msg)
    if not ok: fails.append(msg)

def val(v):
    if "stringValue" in v: return v["stringValue"]
    if "intValue" in v: return int(v["intValue"])
    if "doubleValue" in v: return v["doubleValue"]
    if "boolValue" in v: return v["boolValue"]
    if "kvlistValue" in v: return attrs(v["kvlistValue"].get("values", []))
    return v
def attrs(kvs): return {k["key"]: val(k["value"]) for k in kvs}

def records(stream):
    p = os.path.join(out, stream + ".jsonl")
    if not os.path.exists(p): return []
    recs = []
    for line in open(p):
        line = line.strip()
        if not line: continue
        for rl in json.loads(line).get("resourceLogs", []):
            for sl in rl.get("scopeLogs", []):
                for r in sl.get("logRecords", []):
                    recs.append({"body": val(r.get("body", {})), "sev": r.get("severityText"),
                                 "attrs": attrs(r.get("attributes", [])), "time": r.get("timeUnixNano")})
    return recs

api = records("portfolio_api")
a = [r for r in api if r["body"] == "request completed"]
check(len(a) == 1 and a[0]["sev"] == "INFO", "api: pino msg as body, level 30 -> INFO")
check(a and a[0]["attrs"].get("req", {}).get("method") == "GET", "api: req.method kept as attribute")
check(a and a[0]["time"] == "1732000000000000000", "api: pino time used as timestamp")
check(a and "level" not in a[0]["attrs"] and "msg" not in a[0]["attrs"], "api: level/msg not duplicated as attributes")
e = [r for r in api if r["body"] == "contact send failed"]
check(len(e) == 1 and e[0]["sev"] == "ERROR", "api: level 50 -> ERROR")
c = [r for r in api if isinstance(r["body"], str) and "NODE_CRASH_LINE" in r["body"]]
check(len(c) == 1 and c[0]["body"].startswith("    at Object.<anonymous>") and not c[0]["body"].endswith("\n"),
      "api: non-JSON line delivered as plain body, newline trimmed")
check(len(api) == 3, "api: exactly 3 records (got %d)" % len(api))

db = records("portfolio_db")
check(len(db) == 1 and "ready to accept connections" in db[0]["body"], "db: fixture line delivered")

acc = records("nginx_access")
ok = [r for r in acc if r["attrs"].get("path") == "/index.html"]
check(len(ok) == 1 and all(ok[0]["attrs"].get(k) == v for k, v in
      {"method": "GET", "status": "200", "bytes": "1234", "referrer": "https://example.com/from",
       "user_agent": "Mozilla/5.0 (X11; Linux)"}.items()), "nginx_access: method/path/status/bytes/referrer/user_agent")
dash = [r for r in acc if r["attrs"].get("status") == "400" and r["attrs"].get("bytes") == "-" and r["attrs"].get("referrer") == "-"]
check(any("script" in r["attrs"].get("path", "") for r in dash), "nginx_access: '-' bytes/referrer and odd request chars parsed")
check(any("x16" in str(r["body"]) and r["attrs"].get("status") == "400" for r in acc), "nginx_access: garbage request line still delivered")
check(len(acc) == 3, "nginx_access: exactly 3 records (got %d)" % len(acc))

err = records("nginx_error")
check(len(err) == 1 and err[0]["attrs"].get("level") == "error" and err[0]["sev"].lower() == "error"
      and "open() " in err[0]["body"] and "level" not in err[0]["body"], "nginx_error: level error and message body")

everything = ""
for f in glob.glob(os.path.join(out, "*.jsonl")): everything += open(f).read()
check("UNLABELLED_LINE_MUST_NOT_APPEAR" not in everything, "unlabelled container line appears in no output")

sys.exit(1 if fails else 0)
PY
echo "ALL PASS"
