const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth, isClient } = require('../middleware/auth');

const router = express.Router();

// Clear cart for authenticated user
router.delete('/', auth, isClient, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (cart) {
      cart.items = [];
      cart.updatedAt = Date.now();
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sync entire cart
router.post('/', auth, isClient, async (req, res) => {
  try {
    const { items } = req.body;
    
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }
    
    // Process items: fetch product prices and validate
    const processedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isAvailable) {
        continue; // Skip invalid products
      }
      
      // Get price from product
      let itemPrice = product.price;
      
      // Handle size: only include if it's a valid enum value, otherwise undefined
      let size = item.size && item.size.trim() ? item.size : undefined;
      if (size && !['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'].includes(size)) {
        size = undefined; // Invalid size, ignore it
      }
      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        price: itemPrice,
        ...(size && { size })
      });
    }
    
    // Replace all items with the processed items
    cart.items = processedItems;
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price images isAvailable sizeStock variations seller',
      populate: { path: 'seller', select: 'username shopName' }
    });
    
    res.json({ message: 'Cart synced', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user cart
router.get('/', auth, isClient, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId })
      .populate({
        path: 'items.product',
        select: 'name price images isAvailable sizeStock variations seller',
        populate: { path: 'seller', select: 'username shopName' }
      });

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
      await cart.save();
    }

    res.json({ cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add item to cart
router.post('/add', auth, isClient, async (req, res) => {
  try {
    const { productId, quantity, size, variation, price } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    // Check stock
    if (size && product.sizeStock.length > 0) {
      const sizeStock = product.sizeStock.find(s => s.size === size);
      if (!sizeStock || sizeStock.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient stock for selected size' });
      }
    } else {
      // For products without size or without sizeStock, check totalStock
      // But if product has sizeStock but no size specified, recalculate totalStock from sizeStock
      let availableStock = product.totalStock;
      if (product.sizeStock && product.sizeStock.length > 0 && !size) {
        // Recalculate totalStock from sizeStock entries
        availableStock = product.sizeStock.reduce((sum, s) => sum + s.quantity, 0);
      }
      if (availableStock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
    }

    let cart = await Cart.findOne({ user: req.userId });
    
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId &&
      item.size === size &&
      JSON.stringify(item.variation) === JSON.stringify(variation)
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        size,
        variation,
        price
      });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price images isAvailable seller',
      populate: { path: 'seller', select: 'username shopName' }
    });

    res.json({ message: 'Item added to cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cart item
router.put('/update/:itemId', auth, isClient, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Validate stock
    const product = await Product.findById(item.product);
    if (item.size && product.sizeStock.length > 0) {
      const sizeStock = product.sizeStock.find(s => s.size === item.size);
      if (!sizeStock || sizeStock.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
    } else if (product.totalStock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    item.quantity = quantity;
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price images isAvailable seller',
      populate: { path: 'seller', select: 'username shopName' }
    });

    res.json({ message: 'Cart updated', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', auth, isClient, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items.pull(req.params.itemId);
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name price images isAvailable seller',
      populate: { path: 'seller', select: 'username shopName' }
    });

    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear cart
router.delete('/clear', auth, isClient, async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.userId },
      { items: [], updatedAt: Date.now() }
    );
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;