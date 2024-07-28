const express = require("express");
const morgan = require("morgan");
const {
  createProxyMiddleware,
  responseInterceptor,
} = require("http-proxy-middleware");

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
app.use(
  "/common",
  createProxyMiddleware({
    changeOrigin: true,
    router: (req) => req.query.__host__,
  })
);

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
