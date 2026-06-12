# Use a lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Install FFmpeg (required for watermarking videos)
RUN apk update && apk add --no-cache ffmpeg

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the admin panel port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]