// Consolidate all lambda handlers into a single file

import { handler as rest } from './rest';

import { handler as s3 } from './s3';
import { handler as graphql } from './graphql';
import { handler as reprocess } from './reprocess';
export { rest, s3, graphql, reprocess };
