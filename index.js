// Basic Node.js entrypoint

require('dotenv').config();
const fs = require('fs/promises');
const http = require('http');
const path = require('path');
const port = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'users.json');

const validApiKeys = [];
if (process.env.API_KEY) {
  validApiKeys.push(process.env.API_KEY.trim());
}
if (process.env.API_KEYS) {
  process.env.API_KEYS.split(',').forEach((key) => {
    const trimmed = key.trim();
    if (trimmed) validApiKeys.push(trimmed);
  });
}

const isAuthorized = (req) => {
  const apiKey = req.headers['x-api-key'];
  return typeof apiKey === 'string' && validApiKeys.includes(apiKey.trim());
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const sendHtml = (res, html) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
  res.end(html);
};

const readUsers = async () => {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const writeUsers = async (users) => {
  await fs.writeFile(dataFile, JSON.stringify(users, null, 2));
};

const parseJsonBody = async (req) => {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  return body ? JSON.parse(body) : null;
};

const unauthorized = (res) => {
  sendJson(res, 401, { error: 'Unauthorized', message: 'Missing or invalid API key.' });
};

const badRequest = (res, message) => {
  sendJson(res, 400, { error: 'Bad Request', message });
};

const notFound = (res) => {
  sendJson(res, 404, { error: 'Not found' });
};

const landingPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Landing Page</title>
  <style>
    :root {
      --bg: #0f172a;
      --surface: #111827;
      --primary: #38bdf8;
      --accent: #7c3aed;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --border: rgba(148, 163, 184, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: radial-gradient(circle at top, rgba(56, 189, 248, 0.14), transparent 28%),
                  radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.12), transparent 22%),
                  var(--bg);
      color: var(--text);
    }

    .page {
      max-width: 1024px;
      margin: 0 auto;
      padding: 40px 24px 60px;
    }

    .header {
      display: grid;
      gap: 24px;
      align-items: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 700;
      width: fit-content;
    }

    h1 {
      margin: 0;
      font-size: clamp(2.6rem, 4vw, 4.5rem);
      line-height: 1.02;
    }

    p.lead {
      margin: 0;
      max-width: 740px;
      color: var(--muted);
      font-size: 1.05rem;
      line-height: 1.8;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 24px;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 22px;
      border-radius: 999px;
      border: 1px solid transparent;
      font-weight: 700;
      text-decoration: none;
      color: white;
    }

    .button.primary {
      background: linear-gradient(135deg, var(--primary), #0ea5e9);
      box-shadow: 0 18px 50px rgba(56, 189, 248, 0.18);
    }

    .button.secondary {
      color: var(--text);
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(148, 163, 184, 0.2);
    }

    .card {
      background: rgba(15, 23, 42, 0.82);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 32px;
      margin-top: 40px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
      backdrop-filter: blur(18px);
    }

    .grid {
      display: grid;
      gap: 24px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .feature {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 22px;
      padding: 22px;
    }

    .feature h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 1.15rem;
    }

    .feature p {
      margin: 0;
      color: var(--muted);
      line-height: 1.75;
      font-size: 0.97rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 20px;
    }

    .section-title h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .endpoint {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 20px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(148, 163, 184, 0.1);
      gap: 16px;
      flex-wrap: wrap;
    }

    .endpoint .path {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      color: #a5f3fc;
      font-size: 1rem;
      flex: 1 1 220px;
    }

    .endpoint .method {
      width: fit-content;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      font-size: 0.82rem;
    }

    .endpoint .description {
      color: var(--muted);
      flex: 2 1 300px;
      min-width: 200px;
    }

    .footer {
      margin-top: 48px;
      text-align: center;
      color: rgba(226, 232, 240, 0.68);
      font-size: 0.95rem;
    }

    @media (max-width: 720px) {
      .header, .actions {
        text-align: center;
        justify-items: center;
      }

      .actions {
        justify-content: center;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="header">
      <span class="badge">API Platform</span>
      <div>
        <h1>Beautiful API landing page for your Node.js service</h1>
        <p class="lead">A clean, modern landing page built directly in Node.js. Showcase your endpoints, documentation, and developer experience with a polished first impression.</p>
        <div class="actions">
          <a class="button primary" href="#endpoints">View endpoints</a>
          <a class="button secondary" href="https://nodejs.org/" target="_blank" rel="noopener noreferrer">Powered by Node</a>
        </div>
      </div>
    </header>

    <div class="card">
      <div class="section-title">
        <h2>What this API offers</h2>
      </div>

      <div class="grid">
        <div class="feature">
          <h3>Fast Setup</h3>
          <p>Start with a Node.js server and a polished landing page in one file, no frontend build tool required.</p>
        </div>
        <div class="feature">
          <h3>API-first design</h3>
          <p>Present your endpoints clearly so developers can integrate fast and understand your platform at a glance.</p>
        </div>
        <div class="feature">
          <h3>Secure access</h3>
          <p>API endpoints are protected by API keys stored in <code>.env</code>, ensuring only authorized clients can consume the API.</p>
        </div>
      </div>
    </div>

    <section id="endpoints" class="card">
      <div class="section-title">
        <h2>API endpoints</h2>
      </div>
      <div class="endpoint">
        <span class="path">GET /</span>
        <span class="method">GET</span>
        <span class="description">Displays this landing page and API overview.</span>
      </div>
      <div class="endpoint">
        <span class="path">GET /api/status</span>
        <span class="method">GET</span>
        <span class="description">Returns a JSON status object for monitoring and health checks. Requires <code>x-api-key</code>.</span>
      </div>
      <div class="endpoint">
        <span class="path">GET /api/info</span>
        <span class="method">GET</span>
        <span class="description">Returns metadata about the API and service version. Requires <code>x-api-key</code>.</span>
      </div>
      <div class="endpoint">
        <span class="path">GET /api/users</span>
        <span class="method">GET</span>
        <span class="description">Lists all users from the JSON data file. Requires <code>x-api-key</code>.</span>
      </div>
      <div class="endpoint">
        <span class="path">PUT /api/users/:id</span>
        <span class="method">PUT</span>
        <span class="description">Updates a user's fields by ID. Requires <code>x-api-key</code> and JSON body.</span>
      </div>
      <div class="endpoint">
        <span class="path">DELETE /api/users/:id</span>
        <span class="method">DELETE</span>
        <span class="description">Deletes a user by ID from JSON storage. Requires <code>x-api-key</code>.</span>
      </div>
    </section>

    <div class="footer">Deploy this basic API landing page anywhere Node.js runs, then extend the endpoints with your own business logic.</div>
  </div>
</body>
</html>`;

const statusJson = JSON.stringify({ status: 'ok', service: 'lejiend-training', version: '1.0.0' });
const infoJson = JSON.stringify({ name: 'lejiend-training API', description: 'A sample Node.js API landing page', maintained: true });

const requestHandler = async (req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/') {
    sendHtml(res, landingPageHtml);
    return;
  }

  if (pathname.startsWith('/api/')) {
    if (!isAuthorized(req)) {
      unauthorized(res);
      return;
    }
  }

  if (req.method === 'GET' && pathname === '/api/status') {
    sendJson(res, 200, JSON.parse(statusJson));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/info') {
    sendJson(res, 200, JSON.parse(infoJson));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/users') {
    const users = await readUsers();
    sendJson(res, 200, { users });
    return;
  }

  if (pathname.startsWith('/api/users/')) {
    const userId = pathname.slice('/api/users/'.length);
    if (!userId) {
      notFound(res);
      return;
    }

    if (req.method === 'PUT') {
      let body;
      try {
        body = await parseJsonBody(req);
      } catch (error) {
        badRequest(res, 'Invalid JSON payload');
        return;
      }

      if (!body || typeof body !== 'object') {
        badRequest(res, 'Request body must be a JSON object');
        return;
      }

      const users = await readUsers();
      const index = users.findIndex((user) => user.id === userId);
      if (index === -1) {
        notFound(res);
        return;
      }

      users[index] = { ...users[index], ...body, id: users[index].id };
      await writeUsers(users);
      sendJson(res, 200, users[index]);
      return;
    }

    if (req.method === 'DELETE') {
      const users = await readUsers();
      const index = users.findIndex((user) => user.id === userId);
      if (index === -1) {
        notFound(res);
        return;
      }

      const [deletedUser] = users.splice(index, 1);
      await writeUsers(users);
      sendJson(res, 200, { deleted: deletedUser });
      return;
    }
  }

  notFound(res);
};

const server = http.createServer((req, res) => {
  requestHandler(req, res).catch((error) => {
    console.error(error);
    sendJson(res, 500, { error: 'Internal Server Error' });
  });
});

server.listen(port, () => {
  if (validApiKeys.length === 0) {
    console.warn('Warning: No API keys configured. Set API_KEY or API_KEYS in .env to secure API endpoints.');
  }
  console.log(`Server is running at http://localhost:${port}`);
});
