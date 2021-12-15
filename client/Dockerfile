FROM node:16-alpine AS builder
WORKDIR /app
COPY package.json package.json
RUN yarn install
COPY . .
ARG SQ_SITE_NAME
RUN yarn build

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js
EXPOSE 44445
CMD ["node_modules/.bin/next", "start", "-p", "44445"]
