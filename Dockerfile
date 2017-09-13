FROM node:8.4.0

# Install packages
RUN npm install -g yarn

# Set up deploy user and working directory
RUN adduser --disabled-password --gecos '' deploy
RUN mkdir -p /app

# Set up code and install node modules
ADD . /app
WORKDIR /app
RUN yarn install

# Chown working directory to deploy user
RUN chown -R deploy:deploy /app

# Run babel compiler
RUN node_modules/.bin/babel index.js config.js -s inline -d build
RUN node_modules/.bin/babel lib -s inline -d build/lib
RUN node_modules/.bin/babel schema -s inline -d build/schema

# Switch to deploy user
USER deploy

# Start node-forman
CMD node build/index.js
