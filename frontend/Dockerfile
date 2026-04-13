FROM node:20-alpine AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts

COPY angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json ./
COPY public ./public
COPY scripts ./scripts
COPY src ./src
RUN pnpm build

FROM nginx:1.29.8-alpine
WORKDIR /usr/share/nginx/html

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 docker/nginx/docker-entrypoint.d/generate-app-config.sh /docker-entrypoint.d/generate-app-config.sh
COPY public/app-config.template.json /usr/share/nginx/html/app-config.template.json
COPY --from=build /app/dist/boat/browser/ /usr/share/nginx/html/

RUN chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /usr/share/nginx/html \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080
