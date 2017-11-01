FROM node:8.4.0

# Set up deploy user and working directory
RUN adduser --disabled-password --gecos '' deploy
RUN mkdir -p /app

RUN npm install -g yarn@1.2.1

# Set up node_modules
WORKDIR /tmp
ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn install
RUN mv /tmp/node_modules /app/

# Set up /app for deploy user
ADD . /app
WORKDIR /app
RUN chown -R deploy:deploy /app

# Switch to deploy user
USER deploy

# Run babel compiler
RUN node_modules/.bin/babel index.js config.js -s inline -d build
RUN node_modules/.bin/babel lib -s inline -d build/lib
RUN node_modules/.bin/babel schema -s inline -d build/schema

ENV PORT 5001
EXPOSE 5001

# Start node-forman
CMD node_modules/.bin/nf start
