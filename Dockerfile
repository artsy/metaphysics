# ---------------------------------------------------------
# Base build dependencies (development + production)
# ---------------------------------------------------------
FROM node:22.5.1-alpine AS builder-base

WORKDIR /app

RUN apk --no-cache --quiet add \
  bash \
  build-base \
  dumb-init \
  git

# Copy files required to install application dependencies
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY patches ./patches

# Install packages
RUN yarn install --immutable && \
  yarn cache clean

# Copy application code
COPY  . ./

RUN yarn build

# ---------------------------------------------------------
# Builder with production-only dependencies
# ---------------------------------------------------------
FROM builder-base AS builder-production

# Create production-only node_modules
RUN rm -rf node_modules && \
  yarn workspaces focus --all --production

# ---------------------------------------------------------
# Release image
# ---------------------------------------------------------
#
# Release stage. This stage creates the final docker image that will be
# released. It contains only production dependencies and artifacts.
#
FROM node:22.5-alpine AS production

WORKDIR /app

RUN apk --no-cache --quiet add \
  bash \
  dumb-init \
  git \
  && adduser -D -g '' deploy

RUN chown deploy:deploy $(pwd)

# Switch to deploy user
USER deploy

COPY --chown=deploy:deploy --from=builder-production /app/.circleci ./.circleci
COPY --chown=deploy:deploy --from=builder-production /app/build ./build
COPY --chown=deploy:deploy --from=builder-production /app/src/data ./src/data
COPY --chown=deploy:deploy --from=builder-production /app/node_modules ./node_modules
COPY --chown=deploy:deploy --from=builder-production /app/scripts/load_secrets_and_run.sh load_secrets_and_run.sh

ENTRYPOINT ["/usr/bin/dumb-init", "./load_secrets_and_run.sh"]

CMD ["node", "--heapsnapshot-signal=SIGUSR2", "build/index.js"]
