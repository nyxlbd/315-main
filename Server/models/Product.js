const mongoose = require('mongoose');

const sizeStockSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
});

const variationSchema = new mongoose.Schema({
  name: String,          // e.g., "Color", "Flavor", "Material"
  value: String,         // e.g., "Red", "Strawberry", "Cotton"
  priceAdjustment: {     // Additional price for this variation
    type: Number,
    default: 0
  },
  image: String          // Optional image for this variation
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  // Size-based stock management
  sizeStock: [sizeStockSchema],
  
  // Product variations (color, flavor, etc.)
  variations: [variationSchema],
  
  // Total stock (calculated from sizeStock)
  totalStock: {
    type: Number,
    default: 0
  },
  
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  soldCount: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isFlashSale: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Calculate total stock before saving
productSchema.pre('save', function(next) {
  if (this.sizeStock && this.sizeStock.length > 0) {
    this.totalStock = this.sizeStock.reduce((total, item) => total + item.quantity, 0);
  }
  // Automatically set isAvailable to false if totalStock is 0
  if (this.totalStock === 0) {
    this.isAvailable = false;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);