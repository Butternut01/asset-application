const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// Protected update route
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove protected fields
    delete updateData.purchase_date;
    delete updateData.commissioning_date;
    delete updateData._id;
    
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;