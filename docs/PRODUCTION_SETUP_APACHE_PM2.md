# isynergies-web Production Setup (Apache + PM2 + MySQL)

This document describes **production deployment using Apache as a reverse proxy**, with Node.js managed by PM2 and MySQL as the database.

This is **one of two server options**. The other is [Nginx + PM2 + MySQL](PRODUCTION_SETUP_NGINX_PM2.md). Use **either Apache or Nginx — not both**.

---

## 1. SSH Access

### Create an SSH key (on your computer)

```bash
ssh-keygen -t ed25519
# Save as: ~/isyn and ~/isyn.pub
```

### Copy the public key to the server, then connect

```bash
ssh -i ~/isyn root@YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with your server’s IP (e.g. `139.59.246.249`).

---

## 2. Server Preparation

### Update the system

```bash
apt update && apt upgrade -y
```

### Install required packages

```bash
apt install -y git curl build-essential apache2 mysql-server
systemctl enable --now apache2 mysql
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

### (Optional) Harden MySQL

```bash
mysql_secure_installation
```

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

## 8. Apache Reverse Proxy

### Enable required Apache modules

```bash
a2enmod proxy proxy_http proxy_wstunnel headers rewrite
```

### Create your site config

Create a new file. Replace `your-domain.com` with your real domain.

**File:** `/etc/apache2/sites-available/your-domain.com.conf`

```apache
<VirtualHost *:80>
  ServerName your-domain.com
  ServerAlias www.your-domain.com

  ProxyPreserveHost On

  # Allow large uploads (e.g. videos) and long requests
  LimitRequestBody 0
  LimitRequestFieldSize 16384
  LimitRequestFields 200
  LimitRequestLine 16384
  RequestReadTimeout body=0
  ProxyTimeout 300

  RequestHeader set X-Forwarded-Proto "http"
  RequestHeader set X-Forwarded-Port "80"

  ProxyPass / http://127.0.0.1:3000/
  ProxyPassReverse / http://127.0.0.1:3000/

  # WebSocket support
  RewriteEngine On
  RewriteCond %{HTTP:Upgrade} =websocket [NC]
  RewriteRule /(.*) ws://127.0.0.1:3000/$1 [P,L]
  RewriteCond %{HTTP:Upgrade} !=websocket [NC]
  RewriteRule /(.*) http://127.0.0.1:3000/$1 [P,L]

  ErrorLog ${APACHE_LOG_DIR}/isynergies_error.log
  CustomLog ${APACHE_LOG_DIR}/isynergies_access.log combined
</VirtualHost>
```

### Enable the site and reload Apache

```bash
a2dissite 000-default.conf
a2ensite your-domain.com.conf
apachectl configtest
systemctl reload apache2
```

`apachectl configtest` checks the config; fix any errors before reloading.

---

## 9. SSL with Let’s Encrypt

### Point your domain to this server

- **A record:** `your-domain.com` → your server IP  
- **CNAME (optional):** `www.your-domain.com` → `your-domain.com`

### Install Certbot for Apache

```bash
apt install -y certbot python3-certbot-apache
```

### Get a certificate

```bash
certbot --apache -d your-domain.com -d www.your-domain.com
```

Certbot will add HTTPS and set up automatic renewal.

---

## 10. Verify Everything Works

### Check which services are listening

```bash
ss -ltnp | egrep ':80|:443|:3000'
```

You should see:

- **Apache** on ports 80 and 443  
- **Node** on port 3000  

### Confirm Apache is in front

Stop Apache:

```bash
systemctl stop apache2
```

Your site should stop loading. That confirms Apache is the one serving traffic.

Start it again:

```bash
systemctl start apache2
```

---

## Final Architecture

```
Internet
   ↓
Apache (ports 80 / 443)
   ↓ reverse proxy
Node.js (PM2) on localhost:3000
   ↓
MySQL
```

---

## Apache vs Nginx (quick comparison)

| Feature        | Apache                      | Nginx                     |
| -------------- | --------------------------- | ------------------------- |
| Large uploads  | `LimitRequestBody`          | `client_max_body_size`    |
| WebSockets     | Needs `mod_proxy_wstunnel`  | Built-in with headers     |
| Reload config  | `systemctl reload apache2`  | `systemctl reload nginx`  |
| Static files   | Good                        | Very fast                 |

Use **one** of them — not both on the same server for this app.

---

**Summary**

- Apache handles the public traffic (HTTP/HTTPS).  
- PM2 keeps the Node app running and restarts it on reboot.  
- MySQL holds the data.  
- Production-ready, with HTTPS and auto-renewal.
