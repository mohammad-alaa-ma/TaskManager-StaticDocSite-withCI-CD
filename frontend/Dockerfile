# Frontend Dockerfile
FROM nginx:alpine

# Copy frontend files into Nginx
COPY index.html /usr/share/nginx/html/index.html

# Create a script to inject environment variables
RUN echo '#!/bin/sh' > /docker-entrypoint.d/30-envsubst-on-templates.sh && \
    echo 'envsubst < /usr/share/nginx/html/index.html > /tmp/index.html && mv /tmp/index.html /usr/share/nginx/html/index.html' >> /docker-entrypoint.d/30-envsubst-on-templates.sh && \
    chmod +x /docker-entrypoint.d/30-envsubst-on-templates.sh

# Expose port 80
EXPOSE 80

