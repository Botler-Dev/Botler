FROM node:14-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build:prod && (rm -r src & rm -r node_modules && npm ci --production)

CMD npm run bot
