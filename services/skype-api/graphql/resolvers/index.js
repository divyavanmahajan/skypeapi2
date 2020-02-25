import { getSessionsForUser } from './getSessionsForUser';
import { downloadReports } from './downloadReports';
import { getValidDates } from './getValidDates';

// eslint-disable-next-line import/prefer-default-export
export const resolvers = {
  Query: {
    getSessionsForUser: (root, args) => getSessionsForUser(args),
    downloadReports: (root, args) => downloadReports(args),
    getValidDates: (root, args) => getValidDates(args)
  }
};
