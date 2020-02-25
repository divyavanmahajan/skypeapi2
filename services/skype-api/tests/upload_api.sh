#!/bin/sh
# node localtest.js
BASEDIR=$(dirname "$0")
DOMAINSUFFIX=$(grep domainsuffix: ../../../serverless.common.yml | awk '{print $2;}')
SERVICEBASENAME=$(grep servicebasename: ../../../serverless.common.yml | head -1 | awk '{print $2;}')
HOST=${SERVICEBASENAME}.$DOMAINSUFFIX
STAGE=${1-'dev'}
FILE=${2-'sample.xmlsrc'}
echo curl -X POST https://${HOST}/${STAGE}/log -d @${FILE}
curl -X POST https://${HOST}/${STAGE}/log -d @${FILE}
cd ${BASEDIR}
cd ..
AWS_PROFILE=skypelogs sls logs -f rest -r us-east-1 -s dev
