const http = require("http");

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      service: "aether-ath-engine-ci",
      version: "3.2.0"
    }));
    return;
  }

  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("AETHER ATH ENGINE CI OK\n");
});

server.listen(port, "0.0.0.0", () => {
  console.log("ATH CI validation server listening on", port);
});
