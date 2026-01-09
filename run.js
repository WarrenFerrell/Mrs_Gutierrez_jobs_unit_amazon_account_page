#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = __dirname;
const ENTRY_FILE = "Your Account.html";
const START_PORT = Number(process.env.PORT || 3000);
const PORT_SEARCH_SPAN = 20;

const MIME_TYPES = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".download": "application/octet-stream",
};

const command = (process.argv[2] || "").toLowerCase();

if (command !== "start") {
  console.log("Usage: node run start");
  process.exit(command ? 1 : 0);
}

function createServer() {
  return http.createServer((req, res) => {
    const method = req.method || "GET";

    if (!["GET", "HEAD"].includes(method)) {
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
      return;
    }

    let requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (requestPath === "/" || requestPath === "") {
      requestPath = `/${ENTRY_FILE}`;
    }

    const filePath = safeResolve(requestPath);
    if (!filePath) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    deliver(filePath, req, res);
  });
}

function safeResolve(requestPath) {
  const normalized = path.normalize(requestPath);
  const resolved = path.join(ROOT, normalized);
  if (!resolved.startsWith(ROOT)) {
    return null;
  }
  return resolved;
}

function deliver(filePath, req, res) {
  fs.stat(filePath, (statErr, stats) => {
    if (statErr) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }

    let target = filePath;
    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      if (fs.existsSync(indexPath)) {
        target = indexPath;
      } else {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Directory listing not allowed");
        return;
      }
    }

    const ext = path.extname(target).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    const stream = fs.createReadStream(target);
    stream.on("error", () => {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server Error");
    });
    stream.pipe(res);
  });
}

async function startServer() {
  for (let port = START_PORT; port < START_PORT + PORT_SEARCH_SPAN; port += 1) {
    try {
      const server = await listenOnPort(port);
      return { server, port };
    } catch (error) {
      if (error.code !== "EADDRINUSE") {
        throw error;
      }
    }
  }
  throw new Error("Unable to find an open port");
}

function listenOnPort(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    const onError = (error) => {
      server.off("error", onError);
      reject(error);
    };
    server.on("error", onError);
    server.listen(port, () => {
      server.off("error", onError);
      resolve(server);
    });
  });
}

function openBrowser(url) {
  const platform = process.platform;
  let commandName;
  let args;

  if (platform === "darwin") {
    commandName = "open";
    args = [url];
  } else if (platform === "win32") {
    commandName = "cmd";
    args = ["/c", "start", "", url];
  } else {
    commandName = "xdg-open";
    args = [url];
  }

  const child = spawn(commandName, args, { stdio: "ignore", detached: true });
  child.on("error", () => {
    console.log(`Please open your browser and visit: ${url}`);
  });
  child.unref();
}

(async () => {
  try {
    const { server, port } = await startServer();
    const url = `http://localhost:${port}/`;
    console.log(`🌟 Serving ${ENTRY_FILE} at ${url}`);
    console.log("Press Ctrl+C to stop the server.");

    openBrowser(url);

    const cleanup = () => {
      server.close(() => process.exit(0));
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (error) {
    console.error("Unable to start the local server:", error.message);
    process.exit(1);
  }
})();
