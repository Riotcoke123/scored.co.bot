# Use a lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Install FFmpeg (required for watermarking videos)
RUN apk update && apk add --no-cache ffmpeg

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies using the lockfile for
# reproducible, audited installs (npm ci instead of npm install)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Run as a non-root user instead of the default root user inside the container
RUN chown -R node:node /usr/src/app
USER node

# Expose the admin panel port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
