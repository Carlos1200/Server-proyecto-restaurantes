const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const Menu = require("../models/Menu");
const Pedido = require("../models/Pedido");
const { subirImage } = require("../cloudinary/cloudinary");
const { OAuth2Client } = require("google-auth-library");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GraphQLUpload } = require("graphql-upload");

require("dotenv").config({
  path: "variables.env",
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleVerify = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const {
    name,
    picture,
    email,
    familyName,
    google = true,
  } = ticket.getPayload();

  return {
    nombre: name,
    photo: picture,
    email,
    apellido: familyName,
    google,
  };
};

const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre, apellido } = usuario;
  return jwt.sign(
    {
      id,
      email,
      nombre,
      apellido,
    },
    secreta,
    {
      expiresIn,
    }
  );
};

const resolvers = {
  Upload: GraphQLUpload,
  Query: {
    obtenerUsuario: async (_, {}, ctx) => {
      return ctx.usuario;
    },
    obtenerEmpresas: async () => {
      try {
        const empresas = await Empresa.find({});
        return empresas;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerEmpresasRepresentante: async (_, {}, ctx) => {
      try {
        const empresas = await Empresa.find({
          representante: ctx.usuario.id,
        });
        return empresas;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerEmpresa: async (_, { id }) => {
      const empresa = await Empresa.findById(id);

      if (!empresa) {
        throw new Error("Empresa no encontrada");
      }

      return empresa;
    },
    obtenerMenu: async (_, { id }) => {
      const menu = await Menu.find({
        empresa: id,
      });

      if (!menu) {
        throw new Error("No hay menu disponible");
      }
      return menu[0];
    },
  },

  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;

      const existeUsuario = await Usuario.findOne({
        email,
      });
      if (existeUsuario) {
        throw new Error(
          "Ya existe un Usuario registrado con ese correo electronico"
        );
      }
      const salt = bcryptjs.genSaltSync(10);
      input.password = bcryptjs.hashSync(password, salt);

      try {
        const usuario = new Usuario(input);
        const resultado = await usuario.save();
        const token = crearToken(resultado, process.env.SECRETA, "999 years");

        return {
          usuario: resultado,
          token,
        };
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({
        email,
      });
      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }

      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );
      if (!passwordCorrecto) {
        throw new Error("Contraseña incorrecta");
      }

      try {
        const usuario = new Usuario(existeUsuario);
        const resultado = await usuario.save();
        const token = crearToken(resultado, process.env.SECRETA, "999 years");

        return {
          usuario: resultado,
          token,
        };
      } catch (error) {
        console.log(error);
      }
    },
    nuevoUsuarioGoogle: async (_, { tokenGoogle }) => {
      try {
        const { email, nombre, photo, apellido, google } = await googleVerify(
          tokenGoogle
        );

        let usuario = await Usuario.findOne({
          email,
        });

        if (!usuario) {
          // Tengo que crearlo
          const data = {
            nombre,
            apellido,
            email,
            password: ":P",
            photo,
            google,
          };
          usuario = new Usuario(data);
          await usuario.save();
        }

        // Generar el JWT
        const token = crearToken(usuario, process.env.SECRETA, "999 years");
        return {
          usuario,
          token,
        };
      } catch (error) {
        console.log(error);
      }
    },
    validarToken: async (_, {}, ctx) => {
      if (!ctx.usuario) {
        throw new Error("No posee permisos");
      }

      let usuario = await Usuario.findOne({
        email: ctx.usuario.email,
      });
      if (!usuario) {
        throw new Error("No se encontró usuario");
      }

      return {
        usuario,
        token: ctx.token,
      };
    },
    nuevaEmpresa: async (_, { input }, ctx) => {
      subirImage(input.imagen);
      const empresa = new Empresa(input);
      //Asignarle representante a Empresa
      empresa.representante = ctx.usuario.id;

      try {
        const resultado = await empresa.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarEmpresa: async (_, { input, id }, ctx) => {
      //Verificar si la empresa existe
      const existeEmpresa = await Empresa.findOne({
        _id: id,
      });
      if (!existeEmpresa) {
        throw new Error("La empresa no existe");
      }
      //Verificar si es el representante quien lo modifica
      if (existeEmpresa.representante.toString() !== ctx.usuario.id) {
        throw new Error("No posee las credenciales");
      }

      try {
        const empresa = await Empresa.findOneAndUpdate(
          {
            _id: id,
          },
          input,
          {
            new: true,
          }
        );
        return empresa;
      } catch (error) {
        console.log(error);
      }
    },
    eliminarEmpresa: async (_, { id }, ctx) => {
      // Verificar si la empresa existe
      const existeEmpresa = await Empresa.findOne({
        _id: id,
      });
      if (!existeEmpresa) {
        throw new Error("La empresa no existe");
      }
      //Verificar si es el representante quien lo modifica
      if (existeEmpresa.representante.toString() !== ctx.usuario.id) {
        throw new Error("No posee las credenciales");
      }

      //Eliminar empresa
      try {
        await Empresa.findOneAndDelete({
          _id: id,
        });
        return "Empresa Eliminada";
      } catch (error) {
        console.log(error);
      }
    },
    nuevoMenu: async (_, { input, id }, ctx) => {
      // Verificar si la empresa existe
      const existeEmpresa = await Empresa.findOne({
        _id: id,
      });
      if (!existeEmpresa) {
        throw new Error("La empresa no existe");
      }
      //Verificar si es el representante quien crea el menu
      if (existeEmpresa.representante.toString() !== ctx.usuario.id) {
        throw new Error("No posee las credenciales");
      }

      const menu = new Menu(input);
      menu.empresa = existeEmpresa._id;

      try {
        const respuesta = await menu.save();
        return respuesta;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarMenu: async (_, { input, idEmpresa, id }, ctx) => {
      //Verificar si existe el menu
      const existeMenu = await Menu.findOne({
        _id: id,
      });
      if (!existeMenu) {
        throw new Error("El menú no existe");
      }

      // Verificar si la empresa existe
      const existeEmpresa = await Empresa.findOne({
        _id: idEmpresa,
      });
      if (!existeEmpresa) {
        throw new Error("La empresa no existe");
      }

      //Verificar si es de la empresa el menu
      if (existeMenu.empresa.toString() !== existeEmpresa._id.toString()) {
        throw new Error("No posee las credenciales");
      }

      //Verificar si es el representante quien Actualiza el menu
      if (existeEmpresa.representante.toString() !== ctx.usuario.id) {
        throw new Error("No posee las credenciales");
      }

      try {
        const menu = await Menu.findOneAndUpdate(
          {
            _id: id,
          },
          input,
          {
            new: true,
          }
        );
        return menu;
      } catch (error) {
        console.log(error);
      }
    },
    eliminarMenu: async (_, { idEmpresa, id }, ctx) => {
      //Verificar si existe el menu
      const existeMenu = await Menu.findOne({
        _id: id,
      });
      if (!existeMenu) {
        throw new Error("El menú no existe");
      }

      // Verificar si la empresa existe
      const existeEmpresa = await Empresa.findOne({
        _id: idEmpresa,
      });
      if (!existeEmpresa) {
        throw new Error("La empresa no existe");
      }

      //Verificar si es de la empresa el menu
      if (existeMenu.empresa.toString() !== existeEmpresa._id.toString()) {
        throw new Error("No posee las credenciales");
      }

      //Verificar si es el representante quien Actualiza el menu
      if (existeEmpresa.representante.toString() !== ctx.usuario.id) {
        throw new Error("No posee las credenciales");
      }

      try {
        await Menu.findOneAndDelete({
          _id: id,
        });
        return "Menu eliminado";
      } catch (error) {
        console.log(error);
      }
    },
    nuevoPedido: async (_, { input, id }, ctx) => {
      // Verificar si la empresa existe
      const existeEmpresa = await Empresa.findOne({
        _id: id,
      });
      if (!existeEmpresa) {
        throw new Error("La empresa no existe");
      }

      const pedido = new Pedido(input);
      pedido.cliente = ctx.usuario.id;
      pedido.empresa = existeEmpresa._id;

      try {
        const resultado = await pedido.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarPedido: async (_, { input, id }, ctx) => {
      //Verificar si existe pedido
      const existePedido = await Pedido.findById(id);
      if (!existePedido) {
        throw new Error("El pedido no existe");
      }

      const empresa = await Empresa.find({
        _id: existePedido.empresa,
      });
      //Verificar si el cliente es quien lo modifica o el representante
      if (
        existePedido.cliente.toString() !== ctx.usuario.id ||
        empresa[0].representante.toString() !== ctx.usuario.id
      ) {
        throw new Error("No posee las credenciales");
      }

      try {
        const pedido = await Pedido.findOneAndUpdate(
          {
            _id: id,
          },
          input,
          {
            new: true,
          }
        );
        return pedido;
      } catch (error) {
        console.log(error);
      }
    },
  },
};

module.exports = resolvers;
