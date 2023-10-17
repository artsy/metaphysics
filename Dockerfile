# ---------------------------------------------------------
# Base build dependencies
# ---------------------------------------------------------
FROM node:18.15-alpine as builder-base

WORKDIR /app

RUN apk --no-cache --quiet add \
  bash \
  build-base \
  dumb-init \
  git

# Copy files required to install application dependencies
COPY package.json yarn.lock ./
COPY patches ./patches

# Install packages
RUN yarn install --frozen-lockfile --quiet && \
  yarn cache clean --force

# Copy application code
COPY  . ./

# ---------------------------------------------------------
# Production build dependencies and artifacts
# ---------------------------------------------------------
FROM builder-base as builder

RUN yarn build

# Install packages for production
RUN yarn install --production --frozen-lockfile --quiet

# ---------------------------------------------------------
# Release image
# ---------------------------------------------------------
#
# Release stage. This stage creates the final docker image that will be
# released. It contains only production dependencies and artifacts.
#
FROM node:18.15-alpine as production

WORKDIR /app

RUN apk --no-cache --quiet add \
  bash \
  dumb-init \
  git \
  && adduser -D -g '' deploy

RUN chown deploy:deploy $(pwd)

# Switch to deploy user
USER deploy

COPY --chown=deploy:deploy --from=builder /app/.circleci ./.circleci
COPY --chown=deploy:deploy --from=builder /app/build ./build
COPY --chown=deploy:deploy --from=builder /app/src/data ./src/data
COPY --chown=deploy:deploy --from=builder /app/node_modules ./node_modules

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "--heapsnapshot-signal=SIGUSR2", "build/index.js"]
