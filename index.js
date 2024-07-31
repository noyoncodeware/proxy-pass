const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const http = require("http");
const https = require("https");
const app = express();

const PORT = process.env.PORT || 4000;
const API_SERVICE_URL = "https://graph.facebook.com";

app.use(morgan("dev"));

const bufferProxyMiddleware = createProxyMiddleware({
  changeOrigin: true,
  router: (req) => req.query.__host__,
  selfHandleResponse: true,
  on: {
    proxyRes: (proxyRes, req, res) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    },
  },
});

app.use("/buffer", bufferProxyMiddleware);

const customProxyMiddleware = (req, res, next) => {
  const targetUrl = req.query.__host__;
  if (!targetUrl) {
    return res
      .status(400)
      .json({ error: "__host__ query parameter is required" });
  }
  const parsedUrl = new URL(targetUrl);
  const protocol = parsedUrl.protocol === "https:" ? https : http;
  const options = {
    hostname: parsedUrl.hostname,
    // port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
    path: targetUrl + req.url.replace("/common", ""),
    method: req.method,
  };
  console.log({ options });
  const proxyReq = protocol.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, {
      end: true,
    });
  });

  proxyReq.on("error", (err) => {
    console.log({ err });
    res.status(500).json({ error: "Proxy Error", details: err.message });
  });

  req.pipe(proxyReq, {
    end: true,
  });
};

app.use("/common", customProxyMiddleware);

app.use(
  "/api",
  createProxyMiddleware({
    target: API_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      ["^/api"]: "",
    },
  })
);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
