FROM node:8.4.0-alpine

RUN apk update && apk upgrade && apk add alpine-sdk

# Set up deploy user and working directory
RUN adduser -D -g '' deploy
RUN mkdir -p /app

RUN npm install -g yarn@1.0.1

# Set up /app for deploy user
ADD . /app
WORKDIR /app
RUN chown -R deploy:deploy /app

# Switch to deploy user
USER deploy
ENV USER deploy
ENV HOME /home/deploy

# Set up node_modules
RUN yarn install

# Run babel compiler
RUN yarn build

CMD node build/index.js
