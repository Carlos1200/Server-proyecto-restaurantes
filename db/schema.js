const { gql } = require("apollo-server");

const typeDefs = gql`
  scalar Upload
  #Types
  type Usuario {
    id: ID
    nombre: String
    apellido: String
    email: String
    google: Boolean
    photo: String
    creado: String
  }

  type UsuarioToken {
    usuario: Usuario
    token: String
  }

  type Empresa {
    id: ID
    nombre: String
    informacion: String
    representante: ID
    tipo: TipoEmpresa
    ubicacion: Coordenadas
    horario: Horario
    img: String
    creado: String
  }

  type Horario {
    diaLaboral: [Dias]
    horaInicio: Float
    horaFinal: Float
  }

  type Coordenadas {
    lat: Float
    lon: Float
  }

  type Menu {
    platillos: [Platillos]
    empresa: ID
    creado: String
  }

  type Platillos {
    nombre: String
    descripcion: String
    precio: Float
  }

  type Pedido {
    pedido: [Platillos]
    total: Float
    cliente: ID
    empresa: ID
    estado: Estado
    creado: String
  }

  enum Dias {
    Lunes
    Martes
    Miercoles
    Jueves
    Viernes
    Sabado
    Domingo
  }

  enum TipoEmpresa {
    Restaurante
    Supermercado
    Mipymes
  }

  enum Estado {
    Completo
    Pendiente
    Cancelado
  }

  #Inputs
  input InputUsuario {
    nombre: String!
    apellido: String
    email: String!
    password: String!
    token: String
    google: Boolean
    photo: String
  }

  input InputAutenticarUsuario {
    email: String!
    password: String!
  }

  input InputEmpresa {
    nombre: String!
    informacion: String
    tipo: TipoEmpresa!
    horario: HorarioInput!
    representante: ID
    ubicacion: CoordenadasInput!
    imagen: Upload
  }
  input HorarioInput {
    diaLaboral: [Dias]
    horaInicio: Float
    horaFinal: Float
  }

  input CoordenadasInput {
    lat: Float
    lon: Float
  }

  input InputMenu {
    platillos: [InputPlatillos]
  }

  input InputPlatillos {
    nombre: String!
    descripcion: String
    precio: Float!
  }

  input InputPedido {
    pedido: [InputPlatillos]
    total: Float
    cliente: ID
    empresa: ID
  }

  type Query {
    #usuario
    obtenerUsuario: Usuario

    #Empresas
    obtenerEmpresas: [Empresa]
    obtenerEmpresasRepresentante: [Empresa]
    obtenerEmpresa(id: ID!): Empresa

    #Menu
    obtenerMenu(id: ID!): Menu
  }

  type Mutation {
    #Usuario
    nuevoUsuario(input: InputUsuario): UsuarioToken
    nuevoUsuarioGoogle(tokenGoogle: String): UsuarioToken
    autenticarUsuario(input: InputAutenticarUsuario): UsuarioToken
    validarToken: UsuarioToken

    #empresa
    nuevaEmpresa(input: InputEmpresa): Empresa
    actualizarEmpresa(input: InputEmpresa, id: ID!): Empresa
    eliminarEmpresa(id: ID!): String

    #menu
    nuevoMenu(input: InputMenu, id: ID!): Menu
    actualizarMenu(input: InputMenu, idEmpresa: ID!, id: ID!): Menu
    eliminarMenu(idEmpresa: ID!, id: ID!): String

    #Pedidos
    nuevoPedido(input: InputPedido, id: ID!): Pedido
    actualizarPedido(input: InputPedido, id: ID!): Pedido
  }
`;

module.exports = typeDefs;
