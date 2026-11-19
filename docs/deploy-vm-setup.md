# VM setup and rollback guide

One-time setup so the GitHub Actions workflow (`.github/workflows/deploy.yml`) can deploy to your VM. You run these steps by hand. Placeholders in angle brackets need your own values.

Layout on the VM:

```
/var/www/portfolio/
  releases/<sha>/      one directory per deploy
  current -> releases/<sha>   symlink nginx serves
```

## 1. Create the deploy user (on the VM)

```bash
sudo adduser --disabled-password --gecos "" deploy
```

## 2. Generate a dedicated key (on your machine)

```bash
ssh-keygen -t ed25519 -f portfolio_deploy -N "" -C "github-actions-deploy"
```

Install the public key on the VM:

```bash
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "<contents of portfolio_deploy.pub>" | sudo tee -a /home/deploy/.ssh/authorized_keys
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
| `DEPLOY_HOST` | `<your-vm-host>` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_PORT` | SSH port (optional, defaults to 22) |
| `DEPLOY_SSH_KEY` | Full contents of `portfolio_deploy` (the private key), including the `-----BEGIN` and `-----END` lines |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan` below |

Host key:

```bash
ssh-keyscan -p <port> <your-vm-host>
```

Verify the fingerprint against the VM before trusting it. On the VM:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

and locally, compare with `ssh-keyscan -p <port> <your-vm-host> | ssh-keygen -lf -`. If SSH is not on port 22, the `DEPLOY_KNOWN_HOSTS` line must be in `[host]:port` form, which `ssh-keyscan -p <port>` already emits. Paste it unchanged.

Example:

```bash
gh secret set DEPLOY_SSH_KEY < portfolio_deploy
gh secret set DEPLOY_HOST --body "<your-vm-host>"
gh secret set DEPLOY_USER --body "deploy"
gh secret set DEPLOY_KNOWN_HOSTS < known_hosts.txt
```

Afterwards delete the local private key (`rm portfolio_deploy`) or keep it somewhere safe.

## 7. Rollback (on the VM)

Find the previous release (newest first):

```bash
ls -1t /var/www/portfolio/releases
readlink /var/www/portfolio/current
```

Swap `current` atomically, using the same form as the deploy:

```bash
cd /var/www/portfolio
ln -sfn releases/<sha> current.tmp && mv -T current.tmp current
```

The next deploy moves `current` forward again. Only the newest 5 releases are kept, and the active one is never pruned.

## 8. Troubleshooting

- **Host key verification failed:** `DEPLOY_KNOWN_HOSTS` is wrong, stale (VM was rebuilt), or missing the `[host]:port` form for a non-22 port. Re-run `ssh-keyscan`, verify, and update the secret.
- **Permission denied (publickey):** check `DEPLOY_SSH_KEY` has the full key with BEGIN/END lines, the `.pub` is in `/home/deploy/.ssh/authorized_keys`, and perms are 700 (`.ssh`) / 600 (`authorized_keys`), owned by `deploy`.
- **rsync: mkdir failed / No such file:** `/var/www/portfolio/releases` does not exist or is not owned by `deploy`.
- **`mv: cannot overwrite directory`:** `current` is a real directory. Move it aside and seed again (section 4).
- **403 from nginx:** the nginx user cannot read the release. Check `namei -l /var/www/portfolio/current/index.html` for a directory without execute/read permission, and that `root` points at `current`.
- **404 on page refresh for a route:** the `try_files ... /index.html` line is missing.
