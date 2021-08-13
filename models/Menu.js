const mongoose = require("mongoose");

const MenuSchema = mongoose.Schema({
  platillos: {
    type: Array,
    required: true,
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: "Empresa",
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Menu", MenuSchema);
