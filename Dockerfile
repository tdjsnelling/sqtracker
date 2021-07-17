FROM node:14
COPY . .
RUN yarn
EXPOSE 44444
CMD yarn start