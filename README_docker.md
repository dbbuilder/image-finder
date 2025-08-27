# Docker Setup and Troubleshooting Guide

Here's how to work with Docker for your Image Finder API:

## Building the Docker Image

1. **Build the Docker image** from the project directory:
   ```bash
   docker build -t image-finder .
   ```
   This command creates a Docker image named "image-finder" using the Dockerfile in your project.

2. **View your built images**:
   ```bash
   docker images
   ```
   You should see "image-finder" in the list.

## Running the Container

1. **Run the container with environment variables**:
   ```bash
   docker run -p 3000:3000 --env-file .env image-finder
   ```
   This maps port 3000 from the container to your host machine and loads environment variables from your .env file.

2. **Run in detached mode** (background):
   ```bash
   docker run -d -p 3000:3000 --env-file .env --name image-api-container image-finder
   ```
   The `-d` flag runs it in the background, and `--name` gives it a friendly name.

## Troubleshooting Docker Issues

### Image Building Issues

1. **Dockerfile syntax errors**:
   - Check for proper formatting in your Dockerfile
   - Ensure all required files are in the correct locations

2. **Build failures for package installations**:
   ```bash
   docker build --no-cache -t image-finder .
   ```
   Using `--no-cache` forces a fresh build, which can help with dependency issues.

3. **View build logs**:
   Build with verbose output to see more details:
   ```bash
   docker build -t image-finder . --progress=plain
   ```

### Container Runtime Issues

1. **Check container logs**:
   ```bash
   docker logs image-api-container
   ```
   This shows stdout/stderr from your application, which will include any startup errors.

2. **Interactive troubleshooting**:
   ```bash
   docker exec -it image-api-container /bin/sh
   ```
   This gives you a shell inside the running container to investigate issues.

3. **Check environment variables**:
   ```bash
   docker exec image-api-container env
   ```
   Verifies if your environment variables were properly passed to the container.

4. **Network issues**:
   ```bash
   docker run --rm --network host image-finder wget -q -O- http://localhost:3000/health
   ```
   Tests if the service is responding internally.

### Common Issues and Solutions

1. **Missing dependencies**:
   - Edit the Dockerfile to add any missing Alpine packages:
     ```
     RUN apk add --no-cache python3 build-base g++ ...
     ```

2. **Permission issues with Canvas/Sharp**:
   - Canvas requires specific dependencies. Make sure these lines are in your Dockerfile:
     ```
     RUN apk add --no-cache cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev pangomm-dev libjpeg-turbo-dev freetype-dev
     ```

3. **Connection errors to Azure**:
   - Verify your storage connection string is correct
   - Check if the container exists or needs to be created
   - Make sure you're not hitting network restrictions

4. **Container crashes on startup**:
   - Run in interactive mode to see immediate errors:
     ```bash
     docker run -it -p 3000:3000 --env-file .env image-finder
     ```

5. **API not accessible from host**:
   - Verify port mapping with:
     ```bash
     docker ps
     ```
   - Check if the application is binding to 0.0.0.0 instead of localhost

## Monitoring and Management

1. **View all containers**:
   ```bash
   docker ps -a
   ```

2. **Stop a running container**:
   ```bash
   docker stop image-api-container
   ```

3. **Remove a container**:
   ```bash
   docker rm image-api-container
   ```

4. **View container resource usage**:
   ```bash
   docker stats image-api-container
   ```

## Performance Optimization

1. **Multi-stage builds** to reduce image size:
   - Consider updating your Dockerfile to use a build stage for compilation and a runtime stage

2. **Resource limits**:
   ```bash
   docker run -p 3000:3000 --memory=512m --cpus=0.5 --env-file .env image-finder
   ```
   This limits the container to 512MB of memory and half a CPU core.

Remember that your application needs to properly handle container shutdown signals. Make sure it catches SIGTERM and does any necessary cleanup before exiting.