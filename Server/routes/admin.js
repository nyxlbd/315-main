const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Cart = require('../models/Cart');
const Message = require('../models/Message');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// ==================== DASHBOARD ====================

// Get admin dashboard stats
router.get('/dashboard', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'customer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'username email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue by month (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top selling products
    const topProducts = await Product.find()
      .sort({ soldCount: -1 })
      .limit(10)
      .populate('seller', 'username shopName')
      .populate('category', 'name');

    // Top sellers
    const topSellers = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.seller',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);

    await User.populate(topSellers, { path: '_id', select: 'username shopName email' });

    res.json({
      stats: {
        totalUsers,
        totalClients,
        totalSellers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      ordersByStatus,
      revenueByMonth,
      recentOrders,
      recentUsers,
      topProducts,
      topSellers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== USER MANAGEMENT ====================

// Get all users
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { role, search, status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single user details
router.get('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's orders
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's products (if seller)
    let products = [];
    if (user.role === 'seller') {
      products = await Product.find({ seller: user._id })
        .populate('category', 'name')
        .sort({ createdAt: -1 });
    }

    // Get user's reviews (if customer)
    let reviews = [];
    if (user.role === 'customer') {
      reviews = await Review.find({ user: user._id })
        .populate('product', 'name images')
        .sort({ createdAt: -1 });
    }

    res.json({ user, orders, products, reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user and all associated data
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts' });
    }

    // Delete user's cart
    await Cart.deleteMany({ user: userId });

    // Delete user's messages
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

    // Delete user's reviews
    await Review.deleteMany({ user: userId });

    if (user.role === 'seller') {
      // Mark seller's products as unavailable instead of deleting
      await Product.updateMany(
        { seller: userId },
        { isAvailable: false }
      );
    }

    if (user.role === 'customer') {
      // Cancel pending orders
      await Order.updateMany(
        { user: userId, status: { $ne: 'delivered' } },
        { status: 'cancelled' }
      );
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ 
      message: 'User and associated data deleted successfully',
      deletedUser: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle user active status
router.put('/users/:id/toggle-status', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot modify admin accounts' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PRODUCT MANAGEMENT ====================

// Get all products
router.get('/products', auth, isAdmin, async (req, res) => {
  try {
    const { category, seller, status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (seller) query.seller = seller;
    
    // Handle status filter
    if (status === 'pending') query.status = 'pending';
    if (status === 'approved') query.status = 'approved';
    if (status === 'rejected') query.status = 'rejected';
    if (status === 'available') query.isAvailable = true;
    if (status === 'unavailable') query.isAvailable = false;
    
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('seller', 'username shopName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve product
router.patch('/products/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    console.log('Approving product:', req.params.id);
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        isAvailable: true,
        approvedAt: new Date(),
        approvedBy: req.user.userId
      },
      { new: true, runValidators: true }
    ).populate('seller', 'username shopName email')
     .populate('category', 'name');

    if (!product) {
      console.log('Product not found:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product approved successfully:', product._id, 'Status:', product.status);

    res.json({ 
      success: true,
      message: 'Product approved successfully',
      product 
    });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject product
router.patch('/products/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    console.log('Rejecting product:', req.params.id, 'Reason:', reason);
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        isAvailable: false,
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedBy: req.user.userId
      },
      { new: true, runValidators: true }
    ).populate('seller', 'username shopName email')
     .populate('category', 'name');

    if (!product) {
      console.log('Product not found:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product rejected successfully:', product._id, 'Status:', product.status);

    res.json({ 
      success: true,
      message: 'Product rejected successfully',
      product 
    });
  } catch (error) {
    console.error('Error rejecting product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product status (for admin to reset to pending, etc)
router.patch('/products/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    console.log('Updating product status:', req.params.id, 'New status:', status);
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('seller', 'username shopName email')
     .populate('category', 'name');

    if (!product) {
      console.log('Product not found:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product status updated successfully:', product._id, 'Status:', product.status);

    res.json({ 
      success: true,
      message: `Product status updated to ${status}`,
      product 
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product (hard delete)
router.delete('/products/:id', auth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle product availability
router.put('/products/:id/toggle-availability', auth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isAvailable = !product.isAvailable;
    await product.save();

    res.json({ 
      message: `Product ${product.isAvailable ? 'made available' : 'marked unavailable'}`,
      product: {
        id: product._id,
        name: product.name,
        isAvailable: product.isAvailable
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product (featured, flash sale)
router.put('/products/:id', auth, isAdmin, async (req, res) => {
  try {
    const { isFeatured, isFlashSale, discount } = req.body;
    
    const updateData = {};
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isFlashSale !== undefined) updateData.isFlashSale = isFlashSale;
    if (discount !== undefined) updateData.discount = discount;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ 
      message: 'Product updated successfully',
      product 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ORDER MANAGEMENT ====================

// Get all orders
router.get('/orders', auth, isAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = {};
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
      .populate('items.seller', 'username shopName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Transform orders to match frontend expectations
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      return {
        ...orderObj,
        customer: orderObj.user, // Map user to customer
        seller: orderObj.items?.[0]?.seller || null // Extract seller from first item
      };
    });

    const count = await Order.countDocuments(query);

    res.json({
      orders: transformedOrders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== CATEGORY MANAGEMENT ====================

// Get all categories
router.get('/categories', auth, isAdmin, async (req, res) => {
  try {
    console.log('Fetching all categories');
    
    const categories = await Category.find().sort({ name: 1 });
    
    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });
        return {
          ...category.toObject(),
          productCount
        };
      })
    );
    
    console.log('Categories fetched:', categoriesWithCount.length);
    
    res.json({
      success: true,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create category
router.post('/categories', auth, isAdmin, async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body;
    
    console.log('Creating category:', name);

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [{ slug }, { name }] 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Category with this name or slug already exists' 
      });
    }

    const category = new Category({ 
      name, 
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description, 
      icon 
    });
    
    await category.save();
    
    console.log('Category created successfully:', category._id);

    res.status(201).json({ 
      success: true,
      message: 'Category created successfully',
      category 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update category
router.put('/categories/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body;
    
    console.log('Updating category:', req.params.id);

    // Check if another category has the same name/slug
    const existingCategory = await Category.findOne({
      _id: { $ne: req.params.id },
      $or: [{ slug }, { name }]
    });

    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Another category with this name or slug already exists' 
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, slug, description, icon },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    console.log('Category updated successfully:', category._id);

    res.json({ 
      success: true,
      message: 'Category updated successfully',
      category 
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete category
router.delete('/categories/:id', auth, isAdmin, async (req, res) => {
  try {
    console.log('Deleting category:', req.params.id);
    
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${productCount} product(s) are using this category.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    
    console.log('Category deleted successfully:', req.params.id);

    res.json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== SELLER & CUSTOMER MANAGEMENT ====================

// Get all sellers
router.get('/sellers', auth, isAdmin, async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Get product count for each seller
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const productsCount = await Product.countDocuments({ seller: seller._id });
        return {
          ...seller.toObject(),
          productsCount,
        };
      })
    );
    
    res.json({ sellers: sellersWithStats });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all customers
router.get('/customers', auth, isAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
