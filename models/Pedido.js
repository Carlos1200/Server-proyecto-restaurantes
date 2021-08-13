const mongoose = require("mongoose");

const PedidoSchema = mongoose.Schema({
  pedido: {
    type: Array,
    require: true,
  },
  total: {
    type: Number,
    require: true,
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: "Usuario",
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: "Empresa",
  },
  estado: {
    type: String,
    default: "Pendiente",
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Pedido", PedidoSchema);
