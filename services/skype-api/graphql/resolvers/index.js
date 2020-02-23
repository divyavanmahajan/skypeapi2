const { getSessionsForUser } = require("./getSessionsForUser");
const { downloadReports } = require("./downloadReports");
const { getValidDates } = require("./getValidDates");

// eslint-disable-next-line import/prefer-default-export
module.exports.resolvers = {
  Query: {
    getSessionsForUser: (root, args) => getSessionsForUser(args),
    downloadReports: (root, args) => downloadReports(args),
    getValidDates: (root, args) => getValidDates(args)
  }
};
