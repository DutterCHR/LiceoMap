FROM php:8.2-apache-bookworm

RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite headers \
    && printf 'ServerTokens Prod\nServerSignature Off\n' > /etc/apache2/conf-available/security.conf

WORKDIR /var/www/liceomap
COPY docker/apache.conf /etc/apache2/liceomap.conf.template
COPY docker/php.ini /usr/local/etc/php/conf.d/liceomap.ini
COPY docker/entrypoint.sh /usr/local/bin/liceomap-entrypoint
COPY public ./public
COPY src ./src
COPY bin ./bin
COPY database ./database
# Las pruebas solo usan fixtures ficticias; nunca se incluye database/database.sql.
COPY tests ./tests
RUN chmod +x /usr/local/bin/liceomap-entrypoint \
    && chown -R root:root /var/www/liceomap

ENV APP_ENV=production PORT=10000
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD php -r '$port = getenv("PORT") ?: "10000"; $ctx = stream_context_create(["http" => ["header" => "X-Forwarded-Proto: https\r\n", "timeout" => 3]]); exit(@file_get_contents("http://127.0.0.1:$port/health/live", false, $ctx) === false ? 1 : 0);'
ENTRYPOINT ["liceomap-entrypoint"]
CMD ["apache2-foreground"]
