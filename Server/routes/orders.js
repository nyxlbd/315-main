const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth, isClient, isSeller } = require('../middleware/auth');

const router = express.Router();

// Get user orders (client) - supports both /orders/ and /orders/my
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate('items.product', 'name images')
      .populate('items.seller', 'username shopName')
      .sort({ createdAt: -1 });
    // Transform shippingAddress to delivery for frontend compatibility
    const ordersWithDelivery = orders.map(order => {
      const orderObj = order.toObject();
      if (orderObj.shippingAddress) {
        orderObj.delivery = {
          name: orderObj.shippingAddress.name || '',
          address: orderObj.shippingAddress.street || '',
          phone: orderObj.shippingAddress.phone || ''
        };
      }
      return orderObj;
    });
    res.json(ordersWithDelivery);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user orders (client) - root route
router.get('/', auth, isClient, getUserOrders);

// Get user orders (client) - /my route (must be before /:id)
router.get('/my', auth, isClient, getUserOrders);

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images')
      .populate('items.seller', 'username shopName email phone')
      .populate('user', 'username email phone');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const isOwner = order.user._id.toString() === req.userId.toString();
    const isSeller = order.items.some(item => item.seller._id.toString() === req.userId.toString());
    const isAdmin = req.userRole === 'admin';

    if (!isOwner && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Transform shippingAddress to delivery for frontend compatibility
    const orderObj = order.toObject();
    if (orderObj.shippingAddress) {
      orderObj.delivery = {
        name: orderObj.shippingAddress.name || '',
        address: orderObj.shippingAddress.street || '',
        phone: orderObj.shippingAddress.phone || ''
      };
    }

    res.json({ order: orderObj });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create order (client)
router.post('/', auth, isClient, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Validate stock availability and enrich items with seller
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product || !product.isAvailable) {
        return res.status(400).json({ 
          message: `Product ${item.name || product?.name || 'Unknown'} is not available` 
        });
      }

      // Add seller to item if not already present
      if (!item.seller) {
        item.seller = product.seller;
      }
      
      // Validate seller exists
      if (!item.seller) {
        return res.status(400).json({ 
          message: `Product ${item.name || product.name} has no seller assigned` 
        });
      }

      // Check size stock if applicable
      if (item.size && product.sizeStock.length > 0) {
        const sizeStock = product.sizeStock.find(s => s.size === item.size);
        if (!sizeStock || sizeStock.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.name || product.name} (Size: ${item.size})` 
          });
        }
      } else {
        // For products without size or without sizeStock, check totalStock
        // But if product has sizeStock but item.size is empty, recalculate totalStock from sizeStock
        let availableStock = product.totalStock;
        if (product.sizeStock && product.sizeStock.length > 0 && !item.size) {
          // Recalculate totalStock from sizeStock entries
          availableStock = product.sizeStock.reduce((sum, s) => sum + s.quantity, 0);
        }
        if (availableStock < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.name || product.name}` 
          });
        }
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Transform items: convert variationName to variation object, handle empty size
    const transformedItems = items.map(item => {
      const transformed = {
        product: item.product,
        seller: item.seller,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        ...(item.size && item.size.trim() ? { size: item.size } : {}),
        ...(item.variationName && item.variationName.trim() ? { 
          variation: { 
            name: item.variationName,
            value: item.variationName 
          } 
        } : {})
      };
      return transformed;
    });

    const order = new Order({
      user: req.userId,
      items: transformedItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      statusHistory: [{
        status: 'order placed',
        updatedAt: new Date(),
        note: 'Order has been placed'
      }]
    });

    await order.save();

    // Update product stock and sold count
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (item.size && product.sizeStock.length > 0) {
        const sizeIndex = product.sizeStock.findIndex(s => s.size === item.size);
        if (sizeIndex !== -1) {
          product.sizeStock[sizeIndex].quantity -= item.quantity;
        }
      }
      
      product.soldCount += item.quantity;
      await product.save();
    }

    // Clear cart after successful order
    await Cart.findOneAndUpdate(
      { user: req.userId },
      { items: [], updatedAt: Date.now() }
    );

    await order.populate('items.product', 'name images');
    await order.populate('items.seller', 'username shopName');

    // Transform shippingAddress to delivery for frontend compatibility
    const orderObj = order.toObject();
    if (orderObj.shippingAddress) {
      orderObj.delivery = {
        name: orderObj.shippingAddress.name || '',
        address: orderObj.shippingAddress.street || '',
        phone: orderObj.shippingAddress.phone || ''
      };
    }

    res.status(201).json({ 
      message: 'Order created successfully', 
      order: orderObj
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status (seller or admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is seller of this order or admin
    const isSeller = order.items.some(item => item.seller.toString() === req.userId.toString());
    const isAdmin = req.userRole === 'admin';

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Validate status transition
    const validStatuses = ['order placed', 'processing', 'out for delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      updatedAt: new Date(),
      note: note || `Order status updated to ${status}`
    });

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Transform shippingAddress to delivery for frontend compatibility
    const orderObj = order.toObject();
    if (orderObj.shippingAddress) {
      orderObj.delivery = {
        name: orderObj.shippingAddress.name || '',
        address: orderObj.shippingAddress.street || '',
        phone: orderObj.shippingAddress.phone || ''
      };
    }

    res.json({ message: 'Order status updated', order: orderObj });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller orders
router.get('/seller/orders', auth, isSeller, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { 'items.seller': req.userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .populate('user', 'username email phone')
      .sort({ createdAt: -1 });

    // Transform shippingAddress to delivery for frontend compatibility
    const ordersWithDelivery = orders.map(order => {
      const orderObj = order.toObject();
      if (orderObj.shippingAddress) {
        orderObj.delivery = {
          name: orderObj.shippingAddress.name || '',
          address: orderObj.shippingAddress.street || '',
          phone: orderObj.shippingAddress.phone || ''
        };
      }
      return orderObj;
    });

    res.json({ orders: ordersWithDelivery });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;