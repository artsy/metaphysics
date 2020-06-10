FROM node:10.13.0

WORKDIR /app

# Set up deploy user and working directory
RUN apt-get update && apt-get install -y \
  dumb-init \
  libgpm2 \
  libslang2 \
  mc \
  mc-data \
  unzip && \
  adduser --disabled-password --gecos '' deploy

# Install the packages
COPY package.json yarn.lock ./
COPY patches ./patches
RUN yarn install

# Copy application code
COPY . ./

RUN yarn build && chown -R deploy:deploy ./

# Switch to deploy user
USER deploy

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "build/index.js"]
