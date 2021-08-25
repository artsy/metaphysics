FROM node:14.17-alpine

WORKDIR /app

RUN apk --no-cache --quiet add \
  bash \
  build-base \
  dumb-init \
  git \
  python && \
  adduser -D -g '' deploy

RUN chown deploy:deploy $(pwd)

# Switch to deploy user
USER deploy

# Copy files required to install application dependencies
COPY --chown=deploy:deploy package.json yarn.lock ./
COPY --chown=deploy:deploy patches ./patches

# Install packages
RUN yarn install --frozen-lockfile --quiet && \
  yarn cache clean --force

# Copy application code
COPY --chown=deploy:deploy . ./

RUN yarn build

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "--heapsnapshot-signal=SIGUSR2", "build/index.js"]
