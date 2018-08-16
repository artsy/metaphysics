#! /bin/bash

# Check required env vars
if [[ -z $AWS_ACCESS_KEY_ID || -z $AWS_SECRET_ACCESS_KEY || -z $AWS_BUCKET || -z $AWS_BUCKET_PATH ]]; then
  echo "Set required env vars AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET and AWS_BUCKET_PATH"
  exit 1
fi

# Configure mc
/usr/local/bin/mc config host add s3 https://s3.amazonaws.com $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY

echo "Creating snapshots..."
# create heapsnapshot
kill -USR2 $(pidof node)
sleep 1

echo "Waiting for snapshots to finish..."
while true; do
    ls -l /proc/$(pidof node)/fd/ | grep heapsnapshot > /dev/null
    if [ $? -eq 1 ]; then
        break
    fi
    sleep 1
done

# find heapsnapshots
for heapsnapshot in $(ls -l | grep heapsnapshot | awk '{print $9}')
do
  # Upload heapsnpshot to S3
  /usr/local/bin/mc cp $heapsnapshot s3/$AWS_BUCKET/$AWS_BUCKET_PATH/$(date '+%Y-%m-%d--%H-%M-%S')-$(hostname)-$heapsnapshot
done

# Clean up
rm -rf /home/deploy/.mc
rm -f *.heapsnapshot
