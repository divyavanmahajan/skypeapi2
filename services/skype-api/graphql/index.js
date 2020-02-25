/* eslint-disable indent */
import { ApolloServer } from 'apollo-server-lambda';
import { schema } from './schema';
import { resolvers } from './resolvers';
import config from '../../../config';
import { loggerGQL } from '../../../libs/logging';
import { getAbility, initPermissions } from '../../../libs/permissions';

const playgroundSetting = config.GRAPHQL_PLAYGROUND
  ? {
      endpoint: config.IS_LOCAL ? '/graphql' : `/${config.STAGE}/graphql`,
    }
  : false;
// refer to https://www.apollographql.com/docs/apollo-server/deployment/lambda/
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: error => {
    loggerGQL.error(error);
    return error;
  },
  formatResponse: response => {
    loggerGQL.debug(response);
    return response;
  },
  context: ({ event, context }) => {
    initPermissions(event, context);
    return {
      headers: event.headers,
      functionName: context.functionName,
      event,
      context,
      ability: getAbility(),
    };
  },
  //   // By default, the GraphQL Playground interface and GraphQL introspection
  //   // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //   //
  //   // If you'd like to have GraphQL Playground and introspection enabled in production,
  //   // the `playground` and `introspection` options must be set explicitly to `true`.
  //   playground: true,
  //   introspection: true,
  // });
  // Adjust the endpoint to add the stage, when enabling playground.
  playground: playgroundSetting,
  introspection: config.GRAPHQL_PLAYGROUND,
  tracing: true,
});

export const handler = server.createHandler({
  cors: {
    origin: '*',
    credentials: true,
  },
});
