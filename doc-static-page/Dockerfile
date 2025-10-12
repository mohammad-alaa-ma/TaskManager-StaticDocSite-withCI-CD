# Use base image
FROM nginx:alpine

# Copying all website files into Nginx's default web folder
COPY . /usr/share/nginx/html

# Copy nginx configuration to fix CSS MIME type issue
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to access the site
EXPOSE 80

