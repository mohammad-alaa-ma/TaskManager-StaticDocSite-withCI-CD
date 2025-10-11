# Backend Dockerfile
# FROM node:18

# Use lightweight Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose app port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]

