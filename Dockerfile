FROM node:18-alpine
WORKDIR /app

COPY . .

RUN apk update && \
    apk add -U tzdata

RUN npm install

EXPOSE 3022

ENV TZ=Asia/Taipei

CMD ["npm", "start"]
