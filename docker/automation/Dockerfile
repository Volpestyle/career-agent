# Career Agent Automation Container with VNC
FROM ghcr.io/browserless/chrome:latest

# Set environment variables
ENV DISPLAY=:99
ENV VNC_PASSWORD=career-agent-vnc
ENV SCREEN_WIDTH=1920
ENV SCREEN_HEIGHT=1080
ENV SCREEN_DEPTH=24

# Install additional dependencies
USER root
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    x11vnc \
    xvfb \
    fluxbox \
    novnc \
    websockify \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (if not already in base image)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY automation-worker.js ./

# Create VNC startup script
RUN echo '#!/bin/bash\n\
# Start Xvfb\n\
Xvfb :99 -screen 0 ${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH} &\n\
\n\
# Start window manager\n\
fluxbox &\n\
\n\
# Start VNC server\n\
x11vnc -display :99 -nopw -listen localhost -xkb -ncache 10 -ncache_cr -forever &\n\
\n\
# Start noVNC websocket proxy\n\
websockify --web /usr/share/novnc/ 6080 localhost:5900 &\n\
\n\
# Start the automation worker\n\
node automation-worker.js\n\
' > /start.sh && chmod +x /start.sh

# Expose ports
EXPOSE 3000 5900 6080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start everything
CMD ["/start.sh"]