const serverless = require("serverless-http");
const express = require("express");
const { logHandler } = require("./logHandler");

const app = express();
app.set("json spaces", 2);

const router = express.Router();
router.post(`/log`, logHandler);

const stage = process.env.stage || "dev";
app.use(`/${stage}`, router);

// Create log storage endpoint
module.exports.handler = serverless(app);
