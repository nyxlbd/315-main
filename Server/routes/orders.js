const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const { auth, isClient, isSeller } = require('../middleware/auth');
const Message = require('../models/Message');

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
    // Debug: Log incoming order payload
    console.log('ORDER DEBUG: Incoming order payload:', JSON.stringify(req.body, null, 2));

    if (!items || items.length === 0) {
      console.error('ORDER DEBUG: No items in order');
      return res.status(400).json({ message: 'No items in order' });
    }

    // Validate stock availability and enrich items with seller
    for (const item of items) {
      try {
        console.log('ORDER DEBUG: Processing item:', JSON.stringify(item, null, 2));
        const product = await Product.findById(item.product);
        if (!product || !product.isAvailable) {
          console.error('ORDER DEBUG: Product not available:', item.product, product);
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
          console.error('ORDER DEBUG: No seller for product:', item.product, product);
          return res.status(400).json({ 
            message: `Product ${item.name || product.name} has no seller assigned` 
          });
        }
        // Check size stock if applicable
        if (item.size && product.sizeStock.length > 0) {
          const sizeStock = product.sizeStock.find(s => s.size === item.size);
          if (!sizeStock || sizeStock.quantity < item.quantity) {
            console.error('ORDER DEBUG: Insufficient stock for size:', { product: product._id, size: item.size, available: sizeStock ? sizeStock.quantity : 0, requested: item.quantity });
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
            console.error('ORDER DEBUG: Insufficient stock:', { product: product._id, availableStock, requested: item.quantity });
            return res.status(400).json({ 
              message: `Insufficient stock for ${item.name || product.name}` 
            });
          }
        }
      } catch (itemErr) {
        console.error('ORDER DEBUG: Error processing item:', item, itemErr);
        throw itemErr;
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Transform items: handle empty size
    const transformedItems = items.map(item => {
      const transformed = {
        product: item.product,
        seller: item.seller,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        ...(item.size && item.size.trim() ? { size: item.size } : {})
      };
      return transformed;
    });
    console.log('ORDER DEBUG: Transformed items:', JSON.stringify(transformedItems, null, 2));

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


    try {
      await order.save();
      console.log('ORDER DEBUG: Order saved successfully:', order._id);
    } catch (saveErr) {
      console.error('ORDER DEBUG: Error saving order:', saveErr);
      return res.status(500).json({ message: 'Server error (order save)', error: saveErr.message });
    }

    // Automated message to customer after order placement
    try {
      // For each seller in the order, send a message to the customer
      const uniqueSellers = [...new Set(transformedItems.map(item => item.seller.toString()))];
      for (const sellerId of uniqueSellers) {
        let conversationId;
        if (typeof Message.getConversationId === 'function') {
          conversationId = Message.getConversationId(req.userId, sellerId);
        } else if (Message.schema && Message.schema.statics.getConversationId) {
          conversationId = Message.schema.statics.getConversationId(req.userId, sellerId);
        } else {
          // fallback: just join the ids
          conversationId = [req.userId, sellerId].sort().join('_');
        }
        try {
          const autoMsg = await Message.create({
            conversation: conversationId,
            sender: sellerId, // Seller as sender (system message)
            receiver: req.userId,
            message: `Thank you for your order! Your order (${order.orderNumber}) has been placed and is being processed.`,
          });
          // Populate sender and receiver for frontend compatibility
          await autoMsg.populate('sender', 'username shopName role');
          await autoMsg.populate('receiver', 'username shopName role');
          console.log('ORDER DEBUG: Automated message sent for seller:', sellerId);
        } catch (msgCreateErr) {
          console.error('ORDER DEBUG: Error creating automated message for seller', sellerId, msgCreateErr);
        }
      }
    } catch (msgErr) {
      // Log but do not block order creation
      console.error('ORDER DEBUG: Failed to send automated order message:', msgErr);
    }

    // Update product stock and sold count
    for (const item of items) {
      try {
        const product = await Product.findById(item.product);
        if (!product) {
          console.error('ORDER DEBUG: Product not found during stock update:', item.product);
          continue;
        }
        if (item.size && product.sizeStock.length > 0) {
          const sizeIndex = product.sizeStock.findIndex(s => s.size === item.size);
          if (sizeIndex !== -1) {
            product.sizeStock[sizeIndex].quantity -= item.quantity;
          }
        }
        product.soldCount += item.quantity;
        await product.save();
        console.log('ORDER DEBUG: Updated stock and sold count for product:', product._id);
      } catch (stockErr) {
        console.error('ORDER DEBUG: Error updating stock for item:', item, stockErr);
      }
    }

    res.status(201).json({ message: 'Order placed successfully', order });
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

    // Check roles
    const isSeller = order.items.some(item => item.seller.toString() === req.userId.toString());
    const isAdmin = req.userRole === 'admin';
    const isOwner = order.user.toString() === req.userId.toString();

    // Validate status transition
    const validStatuses = ['order placed', 'processing', 'out for delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Only allow:
    // - Seller or admin: any status
    // - Client (order owner): only to 'delivered' and only if current status is 'out for delivery'
    if (isSeller || isAdmin) {
      // Allow any status change
    } else if (isOwner && status === 'delivered' && order.status === 'out for delivery') {
      // Allow client to mark as delivered
    } else {
      return res.status(403).json({ message: 'Not authorized to update this order' });
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