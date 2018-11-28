FROM node:10.13.0

# Set up deploy user and working directory
RUN adduser --disabled-password --gecos '' deploy
RUN mkdir -p /app

# Set up dumb-init
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN chown deploy:deploy /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Set up yarn
RUN npm install -g yarn@1.9.4
RUN chmod +x /usr/local/bin/yarn

# Set up mc
ADD https://dl.minio.io/client/mc/release/linux-amd64/mc /usr/local/bin/mc
RUN chown deploy:deploy /usr/local/bin/mc
RUN chmod +x /usr/local/bin/mc

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

ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]
CMD ["node", "build/index.js"]
