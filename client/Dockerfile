FROM node:16-alpine AS builder
ARG SENTRY_AUTH_TOKEN
ENV NODE_ENV=production
ENV SENTRY_ORG=tdjsnelling
ENV SENTRY_PROJECT=sqtracker-frontend
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
WORKDIR /sqtracker
COPY . .
RUN yarn install
RUN echo "{}" > /config.js
RUN ./node_modules/.bin/next build

FROM node:16-alpine
ENV NODE_ENV=production
LABEL org.opencontainers.image.source=https://github.com/tdjsnelling/sqtracker
WORKDIR /sqtracker/client
COPY --from=builder /sqtracker/node_modules ./node_modules
COPY --from=builder /sqtracker/public ./public
COPY --from=builder /sqtracker/.next ./.next
COPY --from=builder /sqtracker/next.config.js ./next.config.js
COPY --from=builder /sqtracker/package.json ./package.json
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
