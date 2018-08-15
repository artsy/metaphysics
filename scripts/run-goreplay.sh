#! /bin/bash

if [[ -z $GOREPLAY_PORT || -z $GOREPLAY_OUTPUT ]]; then
  echo "Not running goreplay."
  while true; do sleep 10; done
else
  echo "Running /usr/local/bin/goreplay --input-raw :$GOREPLAY_PORT --output-$GOREPLAY_OUTPUT"
  /usr/local/bin/goreplay --input-raw :$GOREPLAY_PORT --output-$GOREPLAY_OUTPUT
fi
