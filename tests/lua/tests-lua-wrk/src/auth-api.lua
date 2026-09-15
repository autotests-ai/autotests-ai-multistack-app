-- Official wg/wrk Lua school. Login once in init (vegeta prepare analogue)
-- to stamp Bearer for me / logout. Attack mix matches Vegeta targets:
-- health, POST login, me Bearer, items without Bearer, logout Bearer.
-- JSONL overlay from response() during the run (not only done()).
-- Open 10 HTTP/s via delay(), not wrk2, not -R.

local ffi = require("ffi")
ffi.cdef[[
  typedef long time_t;
  struct timespec { time_t tv_sec; long tv_nsec; };
  int clock_gettime(int clk_id, struct timespec *tp);
]]

local CLOCK_REALTIME = 0
local ts_buf = ffi.new("struct timespec")

local function now_parts()
  if ffi.C.clock_gettime(CLOCK_REALTIME, ts_buf) ~= 0 then
    return os.time(), 0
  end
  return tonumber(ts_buf.tv_sec), tonumber(ts_buf.tv_nsec)
end

local function now_ns()
  local sec, nsec = now_parts()
  return sec * 1000000000 + nsec
end

local function iso8601(sec, nsec)
  local ms = math.floor((nsec or 0) / 1000000)
  return os.date("!%Y-%m-%dT%H:%M:%S", sec) .. string.format(".%03dZ", ms)
end

local function json_escape(value)
  return tostring(value or ""):gsub("\\", "\\\\"):gsub('"', '\\"'):gsub("\n", "\\n")
end

local function sh_quote(value)
  return "'" .. tostring(value):gsub("'", "'\\''") .. "'"
end

local function env_or(name, fallback)
  local value = os.getenv(name)
  if value and value:match("%S") then
    return value
  end
  return fallback
end

local function strip_slash(url)
  return (url or ""):gsub("/+$", "")
end

local token = ""
local login_body = ""
local prefix = ""
local jsonl = nil
local last_start = 0
local last_step = nil
local counter = 1
-- Same 5 packets as tests-go-vegeta prepare.py (open-loop ammo, not a VU session).
local steps = {
  { method = "GET", path = "/api/health", auth = false },
  { method = "POST", path = "/api/auth/login", auth = false, body = "login" },
  { method = "GET", path = "/api/auth/me", auth = true },
  { method = "GET", path = "/api/items", auth = false },
  { method = "POST", path = "/api/auth/logout", auth = true },
}

local function origin()
  local scheme = wrk.scheme or "http"
  local host = wrk.host or "localhost"
  local port = tonumber(wrk.port) or 0
  local default_port = (scheme == "https") and 443 or 80
  if port == 0 or port == default_port then
    return scheme .. "://" .. host
  end
  return scheme .. "://" .. host .. ":" .. tostring(port)
end

local function request_url(path)
  return origin() .. prefix .. path
end

local function login()
  local base = strip_slash(env_or("API_BASE_URL", origin() .. prefix))
  local user = env_or("LOAD_USERNAME", env_or("username", "user1"))
  local password = env_or("LOAD_PASSWORD", env_or("password", "password1"))
  local body_path = os.tmpname()
  local body_file = io.open(body_path, "w")
  if not body_file then
    error("STOP: cannot write wrk login body " .. body_path)
  end
  body_file:write(string.format('{"username":"%s","password":"%s"}', user, password))
  body_file:close()
  local cmd = string.format(
    "curl -sS -m 15 -X POST -H %s -H %s -H %s --data-binary @%s %s",
    sh_quote("Accept: application/json"),
    sh_quote("Content-Type: application/json"),
    sh_quote("User-Agent: tests-lua-wrk"),
    sh_quote(body_path),
    sh_quote(base .. "/api/auth/login")
  )
  local pipe = io.popen(cmd)
  if not pipe then
    os.remove(body_path)
    error("STOP: wrk init login popen failed")
  end
  local raw = pipe:read("*a") or ""
  pipe:close()
  os.remove(body_path)
  local parsed = raw:match('"token"%s*:%s*"(.-)"')
  if not parsed or parsed == "" then
    error("STOP: wrk init login rejected: " .. raw)
  end
  return parsed
end

local function open_jsonl()
  local path = env_or("WRK_JSONL", "build/wrk/results.json")
  local handle = io.open(path, "a")
  if not handle then
    error("STOP: cannot append wrk JSONL " .. path)
  end
  handle:setvbuf("no")
  return handle
end

function init(args)
  prefix = wrk.path or ""
  if prefix == "/" then
    prefix = ""
  end
  prefix = prefix:gsub("/+$", "")
  local user = env_or("LOAD_USERNAME", env_or("username", "user1"))
  local password = env_or("LOAD_PASSWORD", env_or("password", "password1"))
  login_body = string.format('{"username":"%s","password":"%s"}', user, password)
  token = login()
  jsonl = open_jsonl()
end

-- milliseconds (wrk 4.2 ae loop; official scripts/delay.lua returns 10-50).
-- LOAD_RPS=10 and WRK_CONNECTIONS=10 → 1000ms per connection → 10 HTTP/s.
-- Not wrk2, not -R. Smoke leaves LOAD_RPS unset → no delay.
function delay()
  local rps = tonumber(env_or("LOAD_RPS", "0")) or 0
  if rps <= 0 then
    return 0
  end
  local connections = tonumber(env_or("WRK_CONNECTIONS", "1")) or 1
  if connections < 1 then
    connections = 1
  end
  return math.floor(1000 * connections / rps)
end

function request()
  local step = steps[((counter - 1) % #steps) + 1]
  counter = counter + 1
  last_step = step
  last_start = now_ns()
  local hdrs = {
    ["Accept"] = "application/json",
    ["User-Agent"] = "tests-lua-wrk",
  }
  local body = nil
  if step.body == "login" then
    hdrs["Content-Type"] = "application/json"
    body = login_body
  end
  if step.auth then
    hdrs["Authorization"] = "Bearer " .. token
  end
  return wrk.format(step.method, prefix .. step.path, hdrs, body)
end

function response(status, headers, body)
  local latency = now_ns() - last_start
  if latency < 0 then
    latency = 0
  end
  local code = tonumber(status) or 0
  local err = ""
  if code == 0 or code >= 400 then
    err = tostring(code)
  end
  local sec, nsec = now_parts()
  local step = last_step or steps[1]
  local line = string.format(
    '{"timestamp":"%s","latency":%d,"code":%d,"error":"%s","method":"%s","url":"%s"}\n',
    iso8601(sec, nsec),
    latency,
    code,
    json_escape(err),
    step.method,
    json_escape(request_url(step.path))
  )
  if jsonl then
    jsonl:write(line)
    jsonl:flush()
  end
end

function done(summary, latency, requests)
  -- Overlay is streamed from response() during the run, not from done().
end
