#!/usr/bin/env bash
# FractalEngine — OCI VM provisioning script
# Run once as root on a fresh Ubuntu 22.04 OCI instance:
#   sudo DOMAIN=yourdomain.com bash setup-vm.sh
#
# Prerequisites:
#   - Ubuntu 22.04 LTS on OCI
#   - DNS A record for $DOMAIN pointing to this VM's public IP
#   - OCI VCN Security List: allow TCP ingress on ports 80 and 443 from 0.0.0.0/0

set -euo pipefail

# ---------- Configuration ----------
DEPLOY_USER="${DEPLOY_USER:-deploy}"
WEB_ROOT="/var/www/fractalengine"
NGINX_SITE="fractalengine"
DOMAIN="${DOMAIN:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------- System packages ----------
echo "==> Installing packages..."
apt-get update -qq
apt-get install -y nginx rsync curl ufw certbot python3-certbot-nginx

# ---------- Deploy user ----------
if ! id "$DEPLOY_USER" &>/dev/null; then
    echo "==> Creating deploy user: $DEPLOY_USER"
    useradd -m -s /bin/bash "$DEPLOY_USER"
    mkdir -p "/home/$DEPLOY_USER/.ssh"
    chmod 700 "/home/$DEPLOY_USER/.ssh"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
    echo ""
    echo "  ACTION REQUIRED: Add the deploy SSH public key to:"
    echo "  /home/$DEPLOY_USER/.ssh/authorized_keys"
    echo ""
else
    echo "==> Deploy user '$DEPLOY_USER' already exists, skipping."
fi

# ---------- Web root ----------
echo "==> Setting up web root: $WEB_ROOT"
mkdir -p "$WEB_ROOT"
chown -R "$DEPLOY_USER:www-data" "$WEB_ROOT"
chmod 2755 "$WEB_ROOT"

# ---------- Nginx config ----------
echo "==> Configuring nginx..."
NGINX_CONF="$SCRIPT_DIR/../deploy/nginx.conf"
if [ ! -f "$NGINX_CONF" ]; then
    echo "  Warning: $NGINX_CONF not found. Using a copy from the repo."
    echo "  Make sure deploy/nginx.conf exists before running this script."
    exit 1
fi
cp "$NGINX_CONF" "/etc/nginx/sites-available/$NGINX_SITE"

# Replace server_name placeholder with actual domain if provided
if [ -n "$DOMAIN" ]; then
    sed -i "s/server_name _;/server_name $DOMAIN;/g" "/etc/nginx/sites-available/$NGINX_SITE"
fi

ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/$NGINX_SITE"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ---------- Firewall ----------
echo "==> Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ---------- SSL via Let's Encrypt ----------
if [ -n "$DOMAIN" ]; then
    echo "==> Setting up SSL for $DOMAIN..."
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
    systemctl enable certbot.timer
    echo "==> SSL configured. Auto-renewal is enabled."
else
    echo ""
    echo "  DOMAIN not set — skipping SSL setup."
    echo "  To enable SSL later, run:"
    echo "    sudo certbot --nginx -d yourdomain.com"
    echo ""
fi

# ---------- Done ----------
echo ""
echo "========================================="
echo "  FractalEngine VM setup complete!"
echo "========================================="
echo "  Web root:    $WEB_ROOT"
echo "  Nginx site:  $NGINX_SITE"
echo "  Deploy user: $DEPLOY_USER"
[ -n "$DOMAIN" ] && echo "  Domain:      https://$DOMAIN"
echo ""
echo "  REMINDER: Ensure OCI VCN Security List"
echo "  allows TCP ingress on ports 80 and 443."
echo "========================================="
