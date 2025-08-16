FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

COPY client ./client
RUN npm install --prefix ./client

RUN npm run build --prefix ./client

EXPOSE 5000 3000

RUN npm install concurrently --save-dev

CMD ["npm", "run", "dev"]
