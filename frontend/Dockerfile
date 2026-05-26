FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile

# Статика
COPY *.html /srv/
COPY js /srv/js
COPY styles /srv/styles
COPY images /srv/images