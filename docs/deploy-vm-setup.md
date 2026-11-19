# VM setup and rollback guide

One-time setup so the GitHub Actions workflow (`.github/workflows/deploy.yml`) can deploy to your VM. You run these steps by hand. Placeholders in angle brackets need your own values.

Layout on the VM:

```
/var/www/portfolio/
  releases/<sha>/      one directory per deploy
  releases/.<sha>.partial/   upload in progress
  current -> releases/<sha>   symlink nginx serves
```

Uploads land in `releases/.<sha>.partial/` and become `releases/<sha>` when the activate step runs. Leftover `.partial` directories from failed deploys are cleaned up on the next successful deploy.

## 1. Create the deploy user (on the VM)

```bash
sudo adduser --disabled-password --gecos "" deploy
```

rsync must be installed on the VM (the runner has it already):

```bash
sudo apt install -y rsync
```

## 2. Generate a dedicated key (on your machine)

```bash
ssh-keygen -t ed25519 -f portfolio_deploy -N "" -C "github-actions-deploy"
```

Install the public key on the VM. The line must read `restrict ssh-ed25519 AAAA... github-actions-deploy`. `restrict` disables pty allocation and forwarding; rsync and plain commands still work.

```bash
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "restrict <contents of portfolio_deploy.pub>" | sudo tee -a /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

## 3. Create the directories (on the VM)

`releases/` must exist before the first deploy: rsync only creates the final path component.

```bash
sudo mkdir -p /var/www/portfolio/releases
sudo chown -R deploy:deploy /var/www/portfolio
```

The nginx user (e.g. `www-data`) must be able to read the releases. Deploy-owned dirs at 755 and files at 644 are fine (rsync `-a` preserves the build's modes). Check that `/var/www` and `/var/www/portfolio` are at least 755.

## 4. Seed the first release (on the VM)

So the switch is seamless, copy the current site into `releases/initial` and point `current` at it. `current` must be a symlink, not a real directory, otherwise the deploy's `mv -T` fails.

```bash
sudo -u deploy mkdir -p /var/www/portfolio/releases/initial
sudo cp -a <old-site-path>/. /var/www/portfolio/releases/initial/
sudo chown -R deploy:deploy /var/www/portfolio/releases/initial
sudo -u deploy ln -sfn releases/initial /var/www/portfolio/current
ls -l /var/www/portfolio/current
```

## 5. Point nginx at `current`

In your server block:

```nginx
root /var/www/portfolio/current;

location / {
    try_files $uri $uri/ /index.html;
}

# Missing hashed assets must 404, not fall back to index.html (which would be
# served as a broken JS/CSS file after a deploy).
location /assets/ {
    try_files $uri =404;
}
```

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

`disable_symlinks` must be off (the default), or nginx will refuse to follow `current`.

## 6. Add GitHub secrets

Repo > Settings > Secrets and variables > Actions, or `gh secret set NAME < file`.

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | `<your-vm-host>`, exactly the name or IP you pass to `ssh-keyscan` below (the pinned key is matched by that name) |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_PORT` | SSH port (optional, defaults to 22) |
| `DEPLOY_SSH_KEY` | Full contents of `portfolio_deploy` (the private key), including the `-----BEGIN` and `-----END` lines |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan` below |

Host key:

```bash
ssh-keyscan -p <port> -t ed25519 <your-vm-host> > known_hosts.txt
ssh-keygen -lf known_hosts.txt
```

Verify the fingerprint before trusting it. Get the VM's real fingerprint over a trusted channel (your cloud console, or an SSH session you already verified), not over the connection being checked:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

The two fingerprints must match. If SSH is not on port 22, the `DEPLOY_KNOWN_HOSTS` line must be in `[host]:port` form, which `ssh-keyscan -p <port>` already emits. Paste it unchanged.

Example:

```bash
gh secret set DEPLOY_SSH_KEY < portfolio_deploy
gh secret set DEPLOY_HOST --body "<your-vm-host>"
gh secret set DEPLOY_USER --body "deploy"
gh secret set DEPLOY_PORT --body "<port>"   # optional, only if not 22
gh secret set DEPLOY_KNOWN_HOSTS < known_hosts.txt
```

Once the secret is set, delete the local private key (`rm portfolio_deploy`). If you need one later, generate a new key.

## 7. Rollback (on the VM)

Find the previous release (newest first):

```bash
ls -1t /var/www/portfolio/releases
readlink /var/www/portfolio/current
```

Swap `current` atomically, using the same form as the deploy:

```bash
cd /var/www/portfolio
sudo -u deploy ln -sfn releases/<sha> current.tmp && sudo -u deploy mv -T current.tmp current
sudo -u deploy touch releases/<sha>
```

The `touch` marks the rolled-back release as recent so the next deploy does not prune it first.

The next deploy moves `current` forward again. Only the newest 5 releases are kept, and the active one is never pruned.

## 8. Troubleshooting

- **Host key verification failed:** `DEPLOY_KNOWN_HOSTS` is wrong, stale (VM was rebuilt), or missing the `[host]:port` form for a non-22 port. Re-run `ssh-keyscan`, verify, and update the secret.
- **Permission denied (publickey):** check `DEPLOY_SSH_KEY` has the full key with BEGIN/END lines, the `.pub` is in `/home/deploy/.ssh/authorized_keys`, and perms are 700 (`.ssh`) / 600 (`authorized_keys`), owned by `deploy`.
- **`rsync: command not found` / `rsync: connection unexpectedly closed`:** rsync is not installed on the VM. Run `sudo apt install -y rsync`.
- **rsync: mkdir failed / No such file:** `/var/www/portfolio/releases` does not exist or is not owned by `deploy`.
- **`mv: cannot overwrite directory`:** `current` is a real directory. Move it aside and seed again (section 4).
- **403 from nginx:** the nginx user cannot read the release. Check `namei -l /var/www/portfolio/current/index.html` for a directory without execute/read permission, and that `root` points at `current`.
- **404 on page refresh for a route:** the `try_files ... /index.html` line is missing.
