const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// Get paginated inventory items
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 25;
  const skip = (page - 1) * limit;

  console.log(`[GET /] Fetching page ${page} (skip: ${skip}, limit: ${limit})`);

  try {
    const items = await Inventory.find()
      .skip(skip)
      .limit(limit)
      .select('status inventory_number old_inventory_number description user location responsible_person');
    
    const count = await Inventory.countDocuments();
    const totalPages = Math.ceil(count / limit);

    console.log(`[GET /] Fetched ${items.length} items, total pages: ${totalPages}`);

    res.json({
      items,
      currentPage: page,
      totalPages
    });
  } catch (err) {
    console.error(`[GET /] Error fetching inventory:`, err);
    res.status(500).json({ message: err.message });
  }
});

// Search inventory by number (last digits)
router.get('/search', async (req, res) => {
  const searchTerm = req.query.term;
  console.log(`[GET /search] Searching term: ${searchTerm}`);

  try {
    const regex = new RegExp(searchTerm, 'i'); // case-insensitive, partial match
    const items = await Inventory.find({
      $or: [
        { inventory_number: { $regex: regex } },
        { old_inventory_number: { $regex: regex } },
        { user: { $regex: regex } },
        { location: { $regex: regex } },
        { responsible_person: { $regex: regex } },
        { status: { $regex: new RegExp(`^${searchTerm}$`, 'i') } }
      ]
    }).select('status inventory_number old_inventory_number description user location responsible_person');

    console.log(`[GET /search] Found ${items.length} items`);

    res.json(items);
  } catch (err) {
    console.error(`[GET /search] Error during search:`, err);
    res.status(500).json({ message: err.message });
  }
});

// Get single inventory item details
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`[GET /:id] Fetching item with ID: ${id}`);

  try {
    const item = await Inventory.findById(id);
    if (!item) {
      console.warn(`[GET /:id] Item not found for ID: ${id}`);
      return res.status(404).json({ message: 'Item not found' });
    }

    console.log(`[GET /:id] Found item:`, item);
    res.json(item);
  } catch (err) {
    console.error(`[GET /:id] Error fetching item:`, err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
