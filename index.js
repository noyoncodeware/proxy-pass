const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();
const PORT = process.env.PORT || 4000;
const API_SERVICE_URL = "https://graph.facebook.com";

app.use(morgan("dev"));

function getRandomUserAgent() {
  const fakeUserAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59 Safari/537.36",
  ];
  const randomIndex = Math.floor(Math.random() * fakeUserAgents.length);
  return fakeUserAgents[randomIndex];
}

const customProxyMiddleware = async (request, response) => {
  try {
    const host = request.query.__host__;
    if (!host) {
      return response
        .status(400)
        .json({ error: "__host__ query parameter is required" });
    }
    const targetUrl = host + request.url.replaceAll("/buffer", "");
    const arrayBuffer = await axios.get(targetUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": getRandomUserAgent(),
        Referer: "https://www.facebook.com/",
      },
    });
    arrayBuffer.data.pipe(response);
  } catch {
    response.sendStatus(404);
  }
};

app.use("/buffer", customProxyMiddleware);

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
