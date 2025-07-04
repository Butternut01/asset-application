const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  inventory_number: String,
  old_inventory_number: String,
  description: String,
  status: String,
  user: String,
  location: String,
  responsible_person: String,
  quantity: Number,
  purchase_date: Date,
  commissioning_date: Date,
  depreciation_rate: Number,
  expiry_date: Date,
  initial_cost: Number,
  type: String,
  brand: String,
  model: String,
  serial_number: String,
  department: String
}, {
  collection: 'assets' 
});

module.exports = mongoose.model('Inventory', inventorySchema);
