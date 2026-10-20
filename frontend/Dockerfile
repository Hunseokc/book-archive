FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
# /etc/nginx/templates/*.template 은 기동 시 환경변수가 치환되어 conf.d 로 들어간다.
COPY templates /etc/nginx/templates
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://server:8000
EXPOSE 80
