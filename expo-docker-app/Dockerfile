# Use Node.js LTS version as the base image
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    watchman \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Expo CLI globally
RUN npm install -g expo-cli create-expo-app

# Create a new Expo project
RUN npx create-expo-app@latest . --template blank --no-install

# Install dependencies
RUN npm install

# Expose Expo ports
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Set the host IP for Expo
ENV REACT_NATIVE_PACKAGER_HOSTNAME="192.168.0.13"

# Start the Expo development server
CMD ["npx", "expo", "start", "--lan"] 