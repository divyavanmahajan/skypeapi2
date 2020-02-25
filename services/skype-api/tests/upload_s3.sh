#!/bin/sh
BASEDIR=$(dirname "$0")
BUCKET='hcare4-template-uploads-dev-s3bucket-1v4iswyq1wlfo'
FILE=${1-sample.xmlsrc}
# aws s3 cp ${BASEDIR}/sample2.xmlsrc s3://skypelogs-dev/protected/shell/logs/
aws s3 cp $FILE s3://${BUCKET}/protected/shell/logs/
sleep 10
cd ${BASEDIR}
cd ..
AWS_PROFILE=skypelogs sls logs -f s3 -r us-east-1 -s dev
