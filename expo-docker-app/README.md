# Expo Docker App

A React Native application using Expo, containerized with Docker for consistent development environments.

## Prerequisites

- Docker
- Docker Compose (optional, but recommended)

## Getting Started

1. Clone this repository:
```bash
git clone <your-repository-url>
cd expo-docker-app
```

2. Build the Docker image:
```bash
docker build -t expo-docker-app .
```

3. Run the container:
```bash
docker run -it --rm \
  -p 19000:19000 \
  -p 19001:19001 \
  -p 19002:19002 \
  -v $(pwd):/app \
  expo-docker-app
```

## Development

The application will start in development mode. You can access it through:

- Expo Go app on your mobile device (scan the QR code)
- Android Emulator
- iOS Simulator (macOS only)

## Project Structure

```
expo-docker-app/
├── App.js              # Main application component
├── Dockerfile          # Docker configuration
├── .dockerignore       # Docker ignore file
├── package.json        # Node.js dependencies and scripts
└── README.md          # Project documentation
```

## Notes

- The development server runs inside the Docker container
- Your local directory is mounted as a volume, so changes are reflected immediately
- Use the Expo Go app to test on your physical device
- For Android/iOS simulator support, additional configuration may be needed 