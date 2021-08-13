const { ApolloServer } = require("apollo-server-express");
const { graphqlUploadExpress } = require("graphql-upload");
const express = require("express");
const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");
const conectarDB = require("./config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config({
  path: "variables.env",
});

//Conectar DB
conectarDB();

const startServer = async () => {
  //Servidor
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers["authorization"] || "";
      if (token) {
        try {
          const usuario = jwt.verify(
            token.replace("Bearer ", ""),
            process.env.SECRETA
          );

          return {
            usuario,
            token: token.replace("Bearer ", ""),
          };
        } catch (error) {
          console.log(error);
        }
      }
    },
  });
  await server.start();

  const app = express();

  // This middleware should be added before calling `applyMiddleware`.
  app.use(graphqlUploadExpress());

  server.applyMiddleware({ app });

  await new Promise((r) => app.listen({ port: 4000 }, r));

  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
};

startServer();
