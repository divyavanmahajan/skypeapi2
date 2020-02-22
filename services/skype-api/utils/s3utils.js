const { S3, LOG_BUCKET, LOG_XML_PREFIX, LOG_RAW_PREFIX } = require("./aws");

/**
 * Move a S3 file within the same bucket.
 * @param {*} bucket
 * @param {*} srcKey
 * @param {*} targetKey
 */
const moveS3File = async (bucket, srcKey, uuid) => {
  const targetKey = `${LOG_RAW_PREFIX}/${uuid}.log`;
  try {
    const response = await S3.copyObject({
      Bucket: bucket,
      CopySource: `${bucket}/${srcKey}`,
      Key: targetKey
    }).promise();

    console.info(
      `Copied  ${srcKey} copied to ${targetKey} ------\n${JSON.stringify(
        response,
        null,
        2
      )}`
    );

    await S3.deleteObject({
      Bucket: bucket,
      Key: srcKey
    }).promise();
    console.info(`Deleted ${srcKey} removed`);
  } catch (e) {
    console.error(`Error moving ${srcKey} to ${targetKey}: `, e);
  }
};

/**
 * Save XML extracted or sent to API - to a XML file.
 * @param {*} uuid File identifier
 * @param {*} xml  XML string
 */
const saveXMLtoS3 = async (uuid, xml) => {
  const xmlparams = {
    Bucket: LOG_BUCKET,
    Key: `${LOG_XML_PREFIX}/${uuid}.xml`,
    Body: xml
  };
  try {
    await S3.upload(xmlparams, {
      ContentType: "application/xml"
    }).promise();
    console.info("Saved XML ", uuid);
  } catch (fileerr) {
    console.error("Problem saving file.", fileerr);
  }
};

exports.saveXMLtoS3 = saveXMLtoS3;
exports.moveS3File = moveS3File;
