#! /bin/bash

if [[ -z $AWS_ACCESS_KEY_ID || -z $AWS_SECRET_ACCESS_KEY || -z $AWS_BUCKET || -z $AWS_BUCKET_PATH ]]; then
  echo "Unset require env vars AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET and AWS_BUCKET_PATH"
  exit 1
fi

# Configure mc
/usr/local/bin/mc config host add s3 https://s3.amazonaws.com $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY

# create heapsnapshot - dumb-init proxies signal to children
kill -USR2 1

# find heapsnapshots
for heapsnapshot in $(ls -l | grep heapsnapshot | awk '{print $9}')
do
  # wait for heapsnapshot placeholder to be replaced with full heapdump
  while [ ! -s $heapsnapshot ]; do sleep 1; done
  echo "Created $heapsnapshot"

  # Upload heapsnpshot to S3
  /usr/local/bin/mc cp $heapsnapshot s3/$AWS_BUCKET/$AWS_BUCKET_PATH/$heapsnapshot
done

# Clean up
rm -rf /home/deploy/.mc
rm -f *.heapsnapshot
