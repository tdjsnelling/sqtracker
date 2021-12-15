FROM node:16-alpine
WORKDIR /app
COPY config.js /config.js
COPY api/ .
RUN yarn
EXPOSE 44444
CMD yarn start
