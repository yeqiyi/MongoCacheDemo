FROM node:16.6.2

WORKDIR /app

COPY ["package.json","package-lock.json","./"]

RUN npm install

COPY . . 

CMD ["node","app.js"]
