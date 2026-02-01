FROM node:18-alpine

WORKDIR /app/frontend

RUN npm install -g http-server

COPY . .

EXPOSE 8080

CMD ["http-server", ".", "-p", "8080", "--cors"]
