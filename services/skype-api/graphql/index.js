const { ApolloServer } = require("apollo-server-lambda");
const { schema } = require("./schema");
const { resolvers } = require("./resolvers");

// // Construct a schema, using GraphQL schema language
// const typeDefs = schema;

// const server = new ApolloServer({
//   typeDefs,
//   resolvers,

//   // By default, the GraphQL Playground interface and GraphQL introspection
//   // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
//   //
//   // If you'd like to have GraphQL Playground and introspection enabled in production,
//   // the `playground` and `introspection` options must be set explicitly to `true`.
//   playground: true,
//   introspection: true,
// });

// exports.handler = server.createHandler();

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
  // playground: {
  //   endpoint: process.env.REACT_APP_GRAPHQL_ENDPOINT
  //     ? process.env.REACT_APP_GRAPHQL_ENDPOINT
  //     : '/production/graphql',
  // },
  playground: true,
  introspection: true,
  tracing: true
});

module.exports.handler = server.createHandler({
  cors: {
    origin: "*"
  }
});
