const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  size: String,
  variation: {
    name: String,
    value: String
  },
  image: String,
  hasReview: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['order placed', 'processing', 'out for delivery', 'delivered', 'cancelled'],
    default: 'order placed'
  },
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: String,
    phone: String
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'card', 'gcash', 'paymaya'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    updatedAt: { type: Date, default: Date.now },
    note: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date
});

// Generate unique order number - use 'validate' hook so it runs before validation
orderSchema.pre('validate', function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const timestamp = date.getTime();
    this.orderNumber = `PCM${timestamp}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);