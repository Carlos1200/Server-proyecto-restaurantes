const mongoose = require("mongoose");

const EmpresaSchema = mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  informacion: {
    type: String,
    trim: true,
  },
  representante: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Usuario",
  },
  tipo: {
    type: String,
    required: true,
    trim: true,
  },
  horario: {
    diaLaboral: {
      type: Array,
      required: true,
      trim: true,
    },
    horaInicio: {
      type: Number,
      required: true,
    },
    horaFinal: {
      type: Number,
      required: true,
    },
  },
  ubicacion: {
    lat: {
      type: Number,
      required: true,
    },
    lon: {
      type: Number,
      required: true,
    },
  },
  img: {
    type: String,
    trim: true,
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Empresa", EmpresaSchema);