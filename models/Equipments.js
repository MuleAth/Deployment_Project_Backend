const mongoose = require("mongoose");

const Equipments = new mongoose.Schema({
    equipmentname:{
        type: String,
        required: true,
    },
    availableQuantity:{
        type: Number,
        required: true,
    },
    TotalQuantity:{
        type: Number,
    },
    isAvailable:{
        type: Boolean,
        default: false
    }
},{ timestamps: true })

module.exports = mongoose.model("Equipment", Equipments);