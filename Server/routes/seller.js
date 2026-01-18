const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { auth, isSeller } = require('../middleware/auth');

const router = express.Router();

// Get seller dashboard analytics
router.get('/dashboard', auth, isSeller, async (req, res) => {
  try {
    // Total products
    const totalProducts = await Product.countDocuments({ 
      seller: req.userId,
      isAvailable: true 
    });

    // Total orders
    const totalOrders = await Order.countDocuments({ 
      'items.seller': req.userId 
    });

    // Get orders with seller's items
    const orders = await Order.find({ 'items.seller': req.userId });
    
    // Calculate total revenue (only for delivered orders)
    let totalRevenue = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;

    orders.forEach(order => {
      const sellerItems = order.items.filter(
        item => item.seller.toString() === req.userId.toString()
      );
      
      if (order.status === 'delivered') {
        deliveredOrders++;
        sellerItems.forEach(item => {
          totalRevenue += item.price * item.quantity;
        });
      } else if (order.status !== 'cancelled') {
        pendingOrders++;
      }
    });

    // Get products by category
    const productsByCategory = await Product.aggregate([
      { 
        $match: { 
          seller: req.userId, 
          isAvailable: true 
        } 
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find({ 'items.seller': req.userId })
      .populate('user', 'username email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(5);

    // Low stock products
    const lowStockProducts = await Product.find({
      seller: req.userId,
      isAvailable: true,
      totalStock: { $lte: 5, $gt: 0 }
    }).limit(10);

    // Out of stock products
    const outOfStockProducts = await Product.find({
      seller: req.userId,
      isAvailable: true,
      totalStock: 0
    }).limit(10);

    // Average rating
    const products = await Product.find({ seller: req.userId });
    const productIds = products.map(p => p._id);
    
    const ratingStats = await Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Sales by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesByMonth = await Order.aggregate([
      {
        $match: {
          'items.seller': req.userId,
          status: 'delivered',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.seller': req.userId
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { 
            $sum: { 
              $multiply: ['$items.price', '$items.quantity'] 
            } 
          },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      analytics: {
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        deliveredOrders,
        averageRating: ratingStats[0]?.averageRating?.toFixed(1) || 0,
        totalReviews: ratingStats[0]?.totalReviews || 0
      },
      productsByCategory,
      recentOrders,
      lowStockProducts,
      outOfStockProducts,
      salesByMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller's products
router.get('/products', auth, isSeller, async (req, res) => {
  try {
    const { status, category, search, sort } = req.query;
    
    const query = { seller: req.userId };
    
    if (status === 'available') query.isAvailable = true;
    if (status === 'unavailable') query.isAvailable = false;
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    let sortOption = { createdAt: -1 };
    if (sort === 'name-asc') sortOption = { name: 1 };
    if (sort === 'name-desc') sortOption = { name: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'stock-low') sortOption = { totalStock: 1 };

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOption);

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller's orders
router.get('/orders', auth, isSeller, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const query = { 'items.seller': req.userId };
    
    if (status) query.status = status;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .populate('user', 'username email phone')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    // Filter to only show seller's items
    const filteredOrders = orders.map(order => {
      const sellerItems = order.items.filter(
        item => item.seller.toString() === req.userId.toString()
      );
      
      return {
        ...order.toObject(),
        items: sellerItems,
        totalAmount: sellerItems.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        )
      };
    });

    res.json({ orders: filteredOrders });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller's reviews
router.get('/reviews', auth, isSeller, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.userId }).select('_id');
    const productIds = products.map(p => p._id);

    const reviews = await Review.find({ product: { $in: productIds } })
      .populate('product', 'name images')
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update seller profile
router.put('/profile', auth, isSeller, async (req, res) => {
  try {
    const { shopName, shopDescription, phone, address } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (shopName) user.shopName = shopName;
    if (shopDescription) user.shopDescription = shopDescription;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    await user.save();
    
    res.json({ 
      message: 'Profile updated successfully', 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        shopName: user.shopName,
        shopDescription: user.shopDescription,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;