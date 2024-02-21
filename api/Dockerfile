FROM node:16
ENV NODE_ENV=production
ENV SENTRY_DSN="https://9b9761216607428180ea3b32bd1c8e58@o140996.ingest.sentry.io/4504645996576768"
LABEL org.opencontainers.image.source=https://github.com/tdjsnelling/sqtracker
WORKDIR /sqtracker/app
COPY . .
RUN yarn install
EXPOSE 3001
CMD yarn start
