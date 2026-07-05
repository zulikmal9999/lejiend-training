# lejiend-training

A minimal Node.js starter project.

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your API key in `.env`:
   ```env
   ```
3. Run the app:
   ```bash
   npm start
   ```

### Protected endpoints

- `GET /api/status`
- `GET /api/info`

These endpoints require the `x-api-key` request header to match a key in `.env`.

Example request:
```bash
curl -H "x-api-key: your-secret-api-key" http://localhost:3000/api/status
```

The app starts a simple HTTP server on port 3000.
