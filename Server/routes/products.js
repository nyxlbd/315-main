const express = require('express');
const Product = require('../models/Product');
const { auth, isSeller, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all products (with filtering)
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, limit = 20, page = 1, seller, minPrice, maxPrice } = req.query;
    
    const query = { isAvailable: true };
    
    if (category) query.category = category;
    if (seller) query.seller = seller;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort === 'price-asc') sortOption.price = 1;
    if (sort === 'price-desc') sortOption.price = -1;
    if (sort === 'newest') sortOption.createdAt = -1;
    if (sort === 'best-selling') sortOption.soldCount = -1;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('seller', 'username shopName')
      .sort(sortOption)
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

// Get flash sale products
router.get('/flash-sale', async (req, res) => {
  try {
    const products = await Product.find({ isFlashSale: true, isAvailable: true })
      .populate('category', 'name slug')
      .populate('seller', 'username shopName')
      .limit(10);
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get best selling products
router.get('/best-selling', async (req, res) => {
  try {
    const products = await Product.find({ isAvailable: true })
      .populate('category', 'name slug')
      .populate('seller', 'username shopName')
      .sort({ soldCount: -1 })
      .limit(10);
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const products = await Product.find({ 
      category: req.params.categoryId,
      isAvailable: true 
    })
      .populate('category', 'name slug')
      .populate('seller', 'username shopName');
    
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product with details
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('seller', 'username shopName email phone');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create product (seller only)
router.post('/', auth, isSeller, upload.array('images', 5), async (req, res) => {
  try {
    // Get uploaded file paths
    const uploadedImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Get existing images from form data (FormData sends as existingImages[0], existingImages[1], etc.)
    const existingImages = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        existingImages.push(...req.body.existingImages);
      } else {
        existingImages.push(req.body.existingImages);
      }
    }
    // Also check for indexed form (existingImages[0], existingImages[1], etc.)
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('existingImages[') && key.endsWith(']')) {
        const value = req.body[key];
        if (value && !existingImages.includes(value)) {
          existingImages.push(value);
        }
      }
    });
    
    // Filter out blob URLs and combine existing and new images
    const allImages = [...existingImages.filter(img => img && !img.startsWith('blob:')), ...uploadedImages];
    
    // Parse JSON fields
    const sizeStock = req.body.sizeStock ? JSON.parse(req.body.sizeStock) : [];
    const variations = req.body.variations ? JSON.parse(req.body.variations) : [];
    
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      originalPrice: parseFloat(req.body.originalPrice || req.body.price),
      discount: parseFloat(req.body.discount || 0),
      category: req.body.category,
      images: allImages,
      sizeStock: sizeStock,
      variations: variations,
      isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
      isFlashSale: req.body.isFlashSale === 'true' || req.body.isFlashSale === true,
      seller: req.userId
    };

    const product = new Product(productData);
    await product.save();
    
    await product.populate('category', 'name slug');
    
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product (seller only - own products)
router.put('/:id', auth, isSeller, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product
    if (product.seller.toString() !== req.userId.toString() && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    // Get uploaded file paths
    const uploadedImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Get existing images from form data (FormData sends as existingImages[0], existingImages[1], etc.)
    const existingImages = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        existingImages.push(...req.body.existingImages);
      } else {
        existingImages.push(req.body.existingImages);
      }
    }
    // Also check for indexed form (existingImages[0], existingImages[1], etc.)
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('existingImages[') && key.endsWith(']')) {
        const value = req.body[key];
        if (value && !existingImages.includes(value)) {
          existingImages.push(value);
        }
      }
    });
    
    // Filter out blob URLs and combine existing and new images
    const allImages = [...existingImages.filter(img => img && !img.startsWith('blob:')), ...uploadedImages];
    
    // Parse JSON fields if they exist
    const sizeStock = req.body.sizeStock ? JSON.parse(req.body.sizeStock) : product.sizeStock;
    const variations = req.body.variations ? JSON.parse(req.body.variations) : product.variations;
    
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      originalPrice: parseFloat(req.body.originalPrice || req.body.price),
      discount: parseFloat(req.body.discount || 0),
      category: req.body.category,
      images: allImages,
      sizeStock: sizeStock,
      variations: variations,
      isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
      isFlashSale: req.body.isFlashSale === 'true' || req.body.isFlashSale === true,
      updatedAt: Date.now()
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('category', 'name slug');

    res.json({ message: 'Product updated', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete/Mark unavailable product (seller only - own products)
router.delete('/:id', auth, isSeller, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product
    if (product.seller.toString() !== req.userId.toString() && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Mark as unavailable instead of deleting
    product.isAvailable = false;
    await product.save();

    res.json({ message: 'Product marked as unavailable' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;