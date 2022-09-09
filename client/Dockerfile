FROM node:16-alpine AS builder
WORKDIR /sqtracker
COPY . .
RUN yarn install
RUN echo "{}" > /config.js
RUN ./node_modules/.bin/next build

FROM node:16-alpine
WORKDIR /sqtracker/client
COPY --from=builder /sqtracker/node_modules ./node_modules
COPY --from=builder /sqtracker/public ./public
COPY --from=builder /sqtracker/.next ./.next
COPY --from=builder /sqtracker/next.config.js ./next.config.js
EXPOSE 44445
CMD ["node_modules/.bin/next", "start", "-p", "44445"]
