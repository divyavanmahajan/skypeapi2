const { ApolloServer } = require("apollo-server-lambda");
const { schema } = require("./schema");
const { resolvers } = require("./resolvers");
const { STAGE, GRAPHQL_PLAYGROUND, IS_LOCAL } = require("../../../config");
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: error => {
    console.error(error);
    return error;
  },
  formatResponse: response => {
    console.log(response);
    return response;
  },
  context: ({ event, context }) => ({
    headers: event.headers,
    functionName: context.functionName,
    event,
    context
  }),
  //   // By default, the GraphQL Playground interface and GraphQL introspection
  //   // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //   //
  //   // If you'd like to have GraphQL Playground and introspection enabled in production,
  //   // the `playground` and `introspection` options must be set explicitly to `true`.
  //   playground: true,
  //   introspection: true,
  // });
  // Adjust the endpoint to add the stage, when enabling playground.
  playground: GRAPHQL_PLAYGROUND
    ? {
        endpoint: IS_LOCAL ? "/graphql" : `/${STAGE}/graphql`
      }
    : false,
  introspection: GRAPHQL_PLAYGROUND,
  tracing: true
});

module.exports.handler = server.createHandler({
  cors: {
    origin: "*"
  }
});
