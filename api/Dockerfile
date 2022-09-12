FROM node:16-alpine
LABEL org.opencontainers.image.source=https://github.com/tdjsnelling/sqtracker
WORKDIR /sqtracker/app
COPY . .
RUN yarn
EXPOSE 3001
CMD yarn start
