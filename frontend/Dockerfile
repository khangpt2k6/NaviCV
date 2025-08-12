# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies fresh (excludes node_modules from host)
RUN npm ci

# Copy source code (excluding node_modules)
COPY . .

# Build the app
RUN npm run build

# Install serve to run the app
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "dist", "-l", "3000"]


