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
ENV USER deploy
ENV HOME /home/deploy

# Run babel compiler
RUN yarn build:lib
RUN yarn build:index
RUN yarn build:fixtures

ENV PORT 5001
ENV DEBUG=info,error
EXPOSE 5001

CMD node build/index.js
