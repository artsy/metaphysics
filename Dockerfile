# ---------------------------------------------------------
# Base build dependencies
# ---------------------------------------------------------
FROM node:22-alpine as builder-base

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
RUN yarn install --production --frozen-lockfile --quiet && \
  mv node_modules /opt/node_modules.prod && \
  yarn install --frozen-lockfile --quiet && \
  yarn cache clean --force

# Copy application code
COPY  . ./

RUN yarn build

# ---------------------------------------------------------
# Release image
# ---------------------------------------------------------
#
# Release stage. This stage creates the final docker iamge that will be
# released. It contains only production dependencies and artifacts.
#
FROM node:22-alpine as production

WORKDIR /app

RUN apk --no-cache --quiet add \
  bash \
  dumb-init \
  git \
  && adduser -D -g '' deploy

RUN chown deploy:deploy $(pwd)

# Switch to deploy user
USER deploy

COPY --chown=deploy:deploy --from=builder-base /app/.circleci ./.circleci
COPY --chown=deploy:deploy --from=builder-base /app/build ./build
COPY --chown=deploy:deploy --from=builder-base /app/src/data ./src/data
COPY --chown=deploy:deploy --from=builder-base /opt/node_modules.prod ./node_modules
COPY --chown=deploy:deploy --from=builder-base /app/scripts/load_secrets_and_run.sh load_secrets_and_run.sh

ENTRYPOINT ["/usr/bin/dumb-init", "./load_secrets_and_run.sh"]

CMD ["node", "--heapsnapshot-signal=SIGUSR2", "build/index.js"]
