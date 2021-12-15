FROM node:16-alpine AS builder
WORKDIR /app
COPY config.js /config.js
COPY client/ .
RUN yarn install
RUN ./node_modules/.bin/next build

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /config.js /config.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js
EXPOSE 44445
CMD ["node_modules/.bin/next", "start", "-p", "44445"]
