# Domain Deployment for Damshique Intelligence

Since you have your own domain, we have configured `Caddy` to automatically handle SSL/HTTPS for you.

## 1. Configure Your Domain

First, update the `Caddyfile` with your real domain:
1. Open `Caddyfile` in the root directory.
2. Replace `your-domain.com` with your actual domain (e.g., `expense-ai.damshique.com`).
   ```text
   expense-ai.damshique.com {
       reverse_proxy app:3000
   }
   ```

## 2. DNS Setup (Important)

Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and create an **A Record**:
- **Host/Name**: `@` (or `expense-ai` if using a subdomain)
- **Value/Target**: The Public IP Address of your VPS/Server.
- **TTL**: Automatic or 3600.

## 3. Deploy

Once DNS is propagated (can take 5 mins to an hour), run:

```bash
docker-compose up -d --build
```

### What Happens Next?
1. **Caddy** starts on port 80 and 443.
2. It sees your domain in `Caddyfile`.
3. It automatically contacts Let's Encrypt to generate a valid SSL certificate.
4. It begins serving your app securely at `https://your-domain.com`.

## Troubleshooting

- **Check Logs**: If your site doesn't load securely, verify Caddy logs:
  ```bash
  docker-compose logs caddy
  ```
- **Firewall**: Ensure ports `80` and `443` are open on your server firewall.
