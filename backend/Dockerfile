FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your Express app listens on
EXPOSE 8080

CMD [ "node", "server.js" ]