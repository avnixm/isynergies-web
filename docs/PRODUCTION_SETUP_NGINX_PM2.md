# isynergies-web Production Setup (Nginx + PM2 + MySQL)

This document describes **production deployment using Nginx as a reverse proxy**, with Node.js managed by PM2 and MySQL as the database.

This is an **alternative to the Apache setup**. Use **either Apache or Nginx — not both**.

---

## 1. SSH Access

From your local machine:

```bash
ssh -i ~/isyn root@SERVER_IP
```

Replace `SERVER_IP` with your server’s IP (e.g. `139.59.246.249`).

---

## 2. Server Preparation

### Update the system

```bash
apt update && apt upgrade -y
```

### Install required packages

```bash
apt install -y git curl build-essential mysql-server nginx
systemctl enable --now mysql nginx
```

---

## 3. Node.js + PM2

### Install Node.js (LTS) and PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs
npm install -g pm2
```

### Make PM2 start on server reboot

```bash
pm2 startup
pm2 save
```

---

## 4. Clone and Build the App

```bash
cd /var/www
git clone https://github.com/avnixm/isynergies-web.git
cd isynergies-web
npm install
npm run build
```

---

## 5. MySQL Setup

### Create database and user

In MySQL (run `mysql` or `mysql -u root -p`), run:

```sql
CREATE DATABASE isynergies;
CREATE USER 'isynergies_user'@'localhost' IDENTIFIED BY 'admin123';
GRANT ALL PRIVILEGES ON isynergies.* TO 'isynergies_user'@'localhost';
FLUSH PRIVILEGES;
```

*(Use a strong password instead of `admin123` in production.)*

### Run database setup/migrations

From the app directory:

```bash
npm run db:setup
```

*(If your project uses `db:push` or `db:migrate`, use that instead; see [DEPLOYMENT.md](DEPLOYMENT.md).)*

---

## 6. Environment Configuration

In the app folder, create a `.env` file:

```env
DATABASE_URL=mysql://isynergies_user:admin123@localhost:3306/isynergies
PORT=3000
NODE_ENV=production
```

Add any other variables your app needs (e.g. `JWT_SECRET`). See [CONFIGURATION.md](CONFIGURATION.md).

---

## 7. Start the App with PM2

```bash
pm2 start npm --name isynergies-web -- start
pm2 save
```

The app will listen on:

```
http://127.0.0.1:3000
```

You can check status with: `pm2 status`

---

## 8. Nginx Reverse Proxy

### Remove the default site

```bash
rm /etc/nginx/sites-enabled/default
```

### Create your site config

Create a new file, for example:

**File:** `/etc/nginx/sites-available/your-domain.com`

```nginx
server {
  listen 80;
  server_name your-domain.com www.your-domain.com;

  # Allow large uploads (e.g. videos)
  client_max_body_size 0;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support (for HMR / live features if needed)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_read_timeout 300;
    proxy_send_timeout 300;
  }
}
```

Replace `your-domain.com` with your actual domain.

### Enable the site and reload Nginx

```bash
ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

`nginx -t` checks the config; fix any errors before reloading.

---

## 9. SSL with Let’s Encrypt

### Install Certbot for Nginx

```bash
apt install -y certbot python3-certbot-nginx
```

### Get a certificate

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will:

- Create an HTTPS server block
- Redirect HTTP to HTTPS
- Set up automatic renewal

### Test renewal

```bash
certbot renew --dry-run
```

---

## 10. Verify Everything Works

### Check which services are listening

```bash
ss -ltnp | egrep ':80|:443|:3000'
```

You should see:

- **Nginx** on ports 80 and 443
- **Node** on port 3000

### Confirm Nginx is in front

Stop Nginx:

```bash
systemctl stop nginx
```

Your site should stop loading. That confirms Nginx is the one serving traffic.

Start it again:

```bash
systemctl start nginx
```

---

## Final Architecture

```
Internet
   ↓
Nginx (ports 80 / 443)
   ↓ reverse proxy
Node.js (PM2) on localhost:3000
   ↓
MySQL
```

---

## Apache vs Nginx (quick comparison)

| Feature        | Apache                      | Nginx                     |
| -------------- | --------------------------- | ------------------------- |
| Large uploads  | `LimitRequestBody`          | `client_max_body_size`     |
| WebSockets     | Needs `mod_proxy_wstunnel`  | Built-in with headers      |
| Reload config  | `systemctl reload apache2`  | `systemctl reload nginx`   |
| Static files   | Good                        | Very fast                 |

Use **one** of them — not both on the same server for this app.

---

**Summary**

- Nginx handles the public traffic (HTTP/HTTPS).
- PM2 keeps the Node app running and restarts it on reboot.
- MySQL holds the data.
- Production-ready, with HTTPS and auto-renewal.
