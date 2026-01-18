const express = require('express');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { auth, isClient, isSeller } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create review (client only, after delivery)
router.post('/', auth, isClient, async (req, res) => {
  try {
    const { productId, orderId, rating, comment, images } = req.body;

    // Check if order exists and is delivered
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only review delivered orders' });
    }

    // Check if product is in the order
    const orderItem = order.items.find(item => item.product.toString() === productId);
    if (!orderItem) {
      return res.status(400).json({ message: 'Product not in this order' });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ 
      product: productId, 
      user: req.userId, 
      order: orderId 
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create review
    const review = new Review({
      product: productId,
      user: req.userId,
      order: orderId,
      rating,
      comment,
      images: images || []
    });

    await review.save();

    // Mark order item as reviewed
    orderItem.hasReview = true;
    await order.save();

    await review.populate('user', 'username avatar');

    res.status(201).json({ 
      message: 'Review created successfully', 
      review 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reply to review (seller only)
router.post('/:reviewId/reply', auth, isSeller, async (req, res) => {
  try {
    const { comment } = req.body;
    const review = await Review.findById(req.params.reviewId).populate('product');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the seller of the product
    if (review.product.seller.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to reply to this review' });
    }

    review.sellerReply = {
      comment,
      repliedAt: new Date()
    };

    await review.save();
    await review.populate('user', 'username avatar');

    res.json({ 
      message: 'Reply added successfully', 
      review 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's reviews
router.get('/my-reviews', auth, isClient, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.userId })
      .populate('product', 'name images price')
      .sort({ createdAt: -1 });
    
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;