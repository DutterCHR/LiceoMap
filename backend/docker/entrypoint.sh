#!/bin/sh
set -eu
port="${PORT:-10000}"
case "$port" in ''|*[!0-9]*) echo 'PORT inválido' >&2; exit 1;; esac
if [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
    echo 'PORT debe estar entre 1024 y 65535' >&2
    exit 1
fi
printf 'Listen %s\n' "$port" > /etc/apache2/ports.conf
sed "s/__PORT__/$port/g" /etc/apache2/liceomap.conf.template > /etc/apache2/sites-available/000-default.conf
exec docker-php-entrypoint "$@"
