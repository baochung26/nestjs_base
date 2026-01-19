FROM node:18-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Development stage không cần build vì sử dụng watch mode
# Build sẽ được thực hiện tự động khi chạy npm run start:dev

FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --from=build /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
