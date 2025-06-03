FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the Next.js app only in production
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

# Expose port
EXPOSE 3000

# Start the Next.js server
CMD if [ "$NODE_ENV" = "development" ]; then npm run dev; else npm start; fi