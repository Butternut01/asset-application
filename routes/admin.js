const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// Dashboard stats API
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const [
      totalCount,
      byStatus,
      byType,
      byDepartment,
      totalCost,
      recentItems
    ] = await Promise.all([
      // Total count
      Inventory.countDocuments(),

      // Group by status
      Inventory.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Group by type
      Inventory.aggregate([
        { $match: { type: { $ne: null, $ne: '' } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 30 }
      ]),

      // Group by department
      Inventory.aggregate([
        { $match: { department: { $ne: null, $ne: '' } } },
        { $group: { _id: '$department', count: { $sum: 1 }, totalCost: { $sum: '$initial_cost' } } },
        { $sort: { count: -1 } },
        { $limit: 30 }
      ]),

      // Total initial cost
      Inventory.aggregate([
        { $group: { _id: null, total: { $sum: '$initial_cost' } } }
      ]),

      // Recently added items
      Inventory.find()
        .sort({ _id: -1 })
        .limit(5)
        .select('inventory_number description status department type')
    ]);

    res.json({
      totalCount,
      byStatus,
      byType,
      byDepartment,
      totalCost: totalCost[0]?.total || 0,
      recentItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// Delete inventory item
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Inventory.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;