FROM node:16

WORKDIR /book-and-study-api

COPY . .

RUN yarn
RUN yarn generate
# tak ako spustas frontend
CMD [ "yarn", "dev" ]