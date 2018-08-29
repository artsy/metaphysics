FROM node:8.11.3

# Set up deploy user and working directory
RUN adduser --disabled-password --gecos '' deploy
RUN mkdir -p /app

# Set up dumb-init
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN chown deploy:deploy /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Set up goreplay
ADD https://github.com/buger/goreplay/releases/download/v0.16.1/gor_0.16.1_x64.tar.gz /tmp/goreplay.tar.gz
RUN tar xfvz /tmp/goreplay.tar.gz
RUN mv goreplay /usr/local/bin/
RUN rm -f /tmp/goreplay.tar.gz
RUN addgroup gor
RUN addgroup deploy gor
RUN chgrp gor /usr/local/bin/goreplay
RUN chmod 0750 /usr/local/bin/goreplay
RUN setcap "cap_net_raw,cap_net_admin+eip" /usr/local/bin/goreplay

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
