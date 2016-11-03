#!/bin/bash
# Based on http://stackoverflow.com/questions/151677/tool-for-adding-license-headers-to-source-files

for i in */*.js
do
  if ! grep -q @flow $i
  then
    (echo "" & echo "/* @flow */") > flowificator
    cat flowificator $i >$i.new && mv $i.new $i
    rm flowificator
  fi
done