FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --force
COPY . .
EXPOSE 3001
CMD ["node", "api/server.mjs"]
