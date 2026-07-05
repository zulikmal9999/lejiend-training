Deployment via GitHub Actions (SSH)

This repository includes two GitHub Actions workflows:
- `.github/workflows/deploy.yml` — a git-based deploy (pulls on server)
- `.github/workflows/deploy-zip.yml` — packages the repository and copies a tarball to the server (no git required on server)

Prerequisites on the target server:
- The server must have Node.js installed.
- Add the repository's public SSH key to the server's `~/.ssh/authorized_keys` for the user that will run the app.
- Ensure the `DEPLOY_PATH` directory is writable by the SSH user; the workflow will create it if missing.

Required repository secrets (set these in GitHub > Settings > Secrets):
- `GH_SECRET_KEY` — the private SSH key (you already have this).
- `SSH_HOST` — host or IP of the target server (e.g. `56.68.63.62`).
- `SSH_USER` — the SSH user on the target server (e.g. `ubuntu` or `root`).
- `DEPLOY_PATH` — full path to the project folder on the server (e.g. `/home/ubuntu/lejiend-training`).
- `SSH_PORT` — optional custom SSH port (omit if using default 22).

Zip-based deploy (no git on server)

Use `.github/workflows/deploy-zip.yml` to deploy to servers that don't have `git` installed. It packages the repository into `deploy.tar.gz`, copies it to the server, extracts into `DEPLOY_PATH`, installs `npm` dependencies, and starts the app with `nohup npm start &`.

How to run the zip deploy manually:
1. Ensure the secrets above are configured in GitHub.
2. In the Actions tab select `CD Deploy (zip)` and click "Run workflow". You can set an optional `branch` input (defaults to `main`).

What the workflow does:
- Checks out the repository on the runner and creates `deploy.tar.gz` (excluding `.git` and `node_modules`).
- Starts an SSH agent with `GH_SECRET_KEY`, ensures the remote `DEPLOY_PATH` exists, and copies the archive via `scp`.
- Extracts the archive on the server, runs `npm install --production`, and starts the app with `nohup npm start > app.log 2>&1 &`.

Notes & safety:
- The workflow will overwrite files in `DEPLOY_PATH` with the archive contents.
- For production, prefer using a process manager (e.g. `pm2`) and add readiness/health checks.
