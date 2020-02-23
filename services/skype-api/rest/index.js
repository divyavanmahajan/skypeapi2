const serverless = require("serverless-http");
const express = require("express");
const { logHandler } = require("./logHandler");
const config = require("../../../config");
const app = express();
app.set("json spaces", 2);

const router = express.Router();
router.post(`/log`, logHandler);

app.use(`/${config.STAGE}`, router);

// Create log storage endpoint
module.exports.handler = serverless(app);
