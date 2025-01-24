FROM node:22-alpine AS base

RUN apk add --update --no-cache \
   tzdata \
   nano \
   bash \
   htop \
   && cp /usr/share/zoneinfo/UTC /etc/localtime \
   && echo "UTC" > /etc/timezone

WORKDIR /server

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY config ./config
COPY src ./src

RUN npm install rimraf -g
RUN npm run build

FROM node:22-alpine AS production

RUN apk add --update --no-cache \
   tzdata \
   nano \
   bash \
   htop \
   && cp /usr/share/zoneinfo/UTC /etc/localtime \
   && echo "UTC" > /etc/timezone

WORKDIR /server

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=base /server/dist ./dist
COPY config ./config

CMD ["node", "dist/main.js"]
