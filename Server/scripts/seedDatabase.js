const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Cart = require('../models/Cart');
const Message = require('../models/Message');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Cart.deleteMany({});
    await Message.deleteMany({});
    console.log('🗑️  Existing data cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

const seedUsers = async () => {
  try {
    const users = [
      {
        username: 'admin',
        email: 'admin@pinecitymade.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      },
      {
        username: 'johnseller',
        email: 'john@seller.com',
        password: 'seller123',
        role: 'seller',
        shopName: 'John\'s Handicrafts',
        shopDescription: 'Quality handmade products from Pine City',
        phone: '+63 912 345 6789',
        isActive: true
      },
      {
        username: 'maryseller',
        email: 'mary@seller.com',
        password: 'seller123',
        role: 'seller',
        shopName: 'Mary\'s Delicacies',
        shopDescription: 'Traditional delicacies and local treats',
        phone: '+63 923 456 7890',
        isActive: true
      },
      {
        username: 'testclient',
        email: 'client@test.com',
        password: 'client123',
        role: 'client',
        phone: '+63 934 567 8901',
        address: {
          street: '123 Main Street',
          city: 'Pine City',
          province: 'Benguet',
          postalCode: '2600',
          country: 'Philippines'
        },
        isActive: true
      },
      {
        username: 'janeclient',
        email: 'jane@client.com',
        password: 'client123',
        role: 'client',
        phone: '+63 945 678 9012',
        address: {
          street: '456 Oak Avenue',
          city: 'Baguio City',
          province: 'Benguet',
          postalCode: '2600',
          country: 'Philippines'
        },
        isActive: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`👥 Users seeded: ${createdUsers.length}`);
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    return [];
  }
};

const seedCategories = async () => {
  try {
    const categories = [
      {
        name: 'Delicacies',
        slug: 'delicacies',
        description: 'Local food products and treats',
        icon: '🍰'
      },
      {
        name: 'Souvenirs',
        slug: 'souvenirs',
        description: 'Memorable items from Pine City',
        icon: '🎁'
      },
      {
        name: 'Clothes',
        slug: 'clothes',
        description: 'Traditional and modern clothing',
        icon: '👕'
      },
      {
        name: 'Art & Culture',
        slug: 'art-culture',
        description: 'Artistic and cultural items',
        icon: '🎨'
      },
      {
        name: 'Health',
        slug: 'health',
        description: 'Health and wellness products',
        icon: '💊'
      },
      {
        name: 'Beverages',
        slug: 'beverages',
        description: 'Local drinks and beverages',
        icon: '☕'
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`📂 Categories seeded: ${createdCategories.length}`);
    return createdCategories;
  } catch (error) {
    console.error('Error seeding categories:', error);
    return [];
  }
};

const seedProducts = async (categories, sellers) => {
  try {
    const seller1 = sellers.find(s => s.email === 'john@seller.com');
    const seller2 = sellers.find(s => s.email === 'mary@seller.com');

    const delicaciesCategory = categories.find(c => c.slug === 'delicacies');
    const souvenirsCategory = categories.find(c => c.slug === 'souvenirs');
    const clothesCategory = categories.find(c => c.slug === 'clothes');
    const artCategory = categories.find(c => c.slug === 'art-culture');
    const healthCategory = categories.find(c => c.slug === 'health');
    const beveragesCategory = categories.find(c => c.slug === 'beverages');

    const products = [
      // Delicacies
      {
        name: 'Strawberry Taho',
        description: 'Fresh strawberry-flavored taho, a traditional Filipino snack',
        price: 50,
        originalPrice: 60,
        discount: 17,
        category: delicaciesCategory._id,
        seller: seller2._id,
        images: ['https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 100 }
        ],
        totalStock: 100,
        variations: [
          { name: 'Flavor', value: 'Strawberry', priceAdjustment: 0 },
          { name: 'Flavor', value: 'Classic', priceAdjustment: -10 }
        ],
        rating: { average: 4.8, count: 45 },
        soldCount: 120,
        isFeatured: true,
        isFlashSale: true,
        isAvailable: true
      },
      {
        name: 'Ube Jam',
        description: 'Homemade purple yam jam, perfect for breakfast',
        price: 150,
        originalPrice: 150,
        discount: 0,
        category: delicaciesCategory._id,
        seller: seller2._id,
        images: ['https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 50 }
        ],
        totalStock: 50,
        variations: [
          { name: 'Size', value: 'Small (250g)', priceAdjustment: 0 },
          { name: 'Size', value: 'Large (500g)', priceAdjustment: 100 }
        ],
        rating: { average: 4.9, count: 67 },
        soldCount: 89,
        isFeatured: true,
        isFlashSale: false,
        isAvailable: true
      },
      {
        name: 'Peanut Brittle',
        description: 'Crispy and sweet peanut brittle candy',
        price: 80,
        originalPrice: 100,
        discount: 20,
        category: delicaciesCategory._id,
        seller: seller2._id,
        images: ['https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 75 }
        ],
        totalStock: 75,
        rating: { average: 4.6, count: 34 },
        soldCount: 56,
        isFeatured: false,
        isFlashSale: true,
        isAvailable: true
      },

      // Souvenirs
      {
        name: 'Pine City Keychain',
        description: 'Handcrafted wooden keychain with Pine City logo',
        price: 80,
        originalPrice: 80,
        discount: 0,
        category: souvenirsCategory._id,
        seller: seller1._id,
        images: ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 200 }
        ],
        totalStock: 200,
        variations: [
          { name: 'Wood Type', value: 'Pine', priceAdjustment: 0 },
          { name: 'Wood Type', value: 'Oak', priceAdjustment: 20 },
          { name: 'Wood Type', value: 'Mahogany', priceAdjustment: 30 }
        ],
        rating: { average: 4.7, count: 89 },
        soldCount: 234,
        isFeatured: true,
        isFlashSale: false,
        isAvailable: true
      },
      {
        name: 'Handwoven Basket',
        description: 'Traditional handwoven basket, perfect for gifts',
        price: 250,
        originalPrice: 300,
        discount: 17,
        category: souvenirsCategory._id,
        seller: seller1._id,
        images: ['https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=500'],
        sizeStock: [
          { size: 'S', quantity: 20 },
          { size: 'M', quantity: 30 },
          { size: 'L', quantity: 15 }
        ],
        totalStock: 65,
        rating: { average: 4.9, count: 78 },
        soldCount: 145,
        isFeatured: true,
        isFlashSale: true,
        isAvailable: true
      },

      // Clothes
      {
        name: 'Traditional Woven Shirt',
        description: 'Handwoven traditional shirt with ethnic patterns',
        price: 800,
        originalPrice: 1000,
        discount: 20,
        category: clothesCategory._id,
        seller: seller1._id,
        images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500'],
        sizeStock: [
          { size: 'S', quantity: 10 },
          { size: 'M', quantity: 15 },
          { size: 'L', quantity: 12 },
          { size: 'XL', quantity: 8 }
        ],
        totalStock: 45,
        variations: [
          { name: 'Color', value: 'Red', priceAdjustment: 0 },
          { name: 'Color', value: 'Blue', priceAdjustment: 0 },
          { name: 'Color', value: 'Green', priceAdjustment: 50 }
        ],
        rating: { average: 4.8, count: 56 },
        soldCount: 89,
        isFeatured: true,
        isFlashSale: false,
        isAvailable: true
      },
      {
        name: 'Woven Scarf',
        description: 'Colorful handwoven scarf with traditional patterns',
        price: 300,
        originalPrice: 350,
        discount: 14,
        category: clothesCategory._id,
        seller: seller1._id,
        images: ['https://images.unsplash.com/photo-1601924357840-3e6c0c9ca51f?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 40 }
        ],
        totalStock: 40,
        variations: [
          { name: 'Pattern', value: 'Classic', priceAdjustment: 0 },
          { name: 'Pattern', value: 'Modern', priceAdjustment: 50 }
        ],
        rating: { average: 4.7, count: 43 },
        soldCount: 67,
        isFeatured: false,
        isFlashSale: true,
        isAvailable: true
      },

      // Art & Culture
      {
        name: 'Wood Carving - Eagle',
        description: 'Intricately carved wooden eagle sculpture',
        price: 1500,
        originalPrice: 1500,
        discount: 0,
        category: artCategory._id,
        seller: seller1._id,
        images: ['https://images.unsplash.com/photo-1582053433926-06b3d5851e0f?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 5 }
        ],
        totalStock: 5,
        rating: { average: 5.0, count: 12 },
        soldCount: 8,
        isFeatured: true,
        isFlashSale: false,
        isAvailable: true
      },
      {
        name: 'Traditional Painting',
        description: 'Hand-painted canvas featuring local scenery',
        price: 2500,
        originalPrice: 3000,
        discount: 17,
        category: artCategory._id,
        seller: seller1._id,
        images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 3 }
        ],
        totalStock: 3,
        rating: { average: 4.9, count: 8 },
        soldCount: 5,
        isFeatured: true,
        isFlashSale: false,
        isAvailable: true
      },

      // Health
      {
        name: 'Herbal Tea Mix',
        description: 'Blend of local herbs for relaxation and wellness',
        price: 120,
        originalPrice: 120,
        discount: 0,
        category: healthCategory._id,
        seller: seller2._id,
        images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 80 }
        ],
        totalStock: 80,
        variations: [
          { name: 'Blend', value: 'Relaxation', priceAdjustment: 0 },
          { name: 'Blend', value: 'Energy', priceAdjustment: 10 },
          { name: 'Blend', value: 'Immunity', priceAdjustment: 20 }
        ],
        rating: { average: 4.6, count: 52 },
        soldCount: 98,
        isFeatured: false,
        isFlashSale: false,
        isAvailable: true
      },
      {
        name: 'Organic Honey',
        description: 'Pure organic honey from local beekeepers',
        price: 200,
        originalPrice: 250,
        discount: 20,
        category: healthCategory._id,
        seller: seller2._id,
        images: ['https://images.unsplash.com/photo-1587049352846-4a222e784769?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 60 }
        ],
        totalStock: 60,
        variations: [
          { name: 'Size', value: '250ml', priceAdjustment: 0 },
          { name: 'Size', value: '500ml', priceAdjustment: 150 }
        ],
        rating: { average: 4.9, count: 71 },
        soldCount: 112,
        isFeatured: true,
        isFlashSale: true,
        isAvailable: true
      },

      // Beverages
      {
        name: 'Pine City Coffee Beans',
        description: 'Locally grown and roasted arabica coffee beans',
        price: 350,
        originalPrice: 400,
        discount: 13,
        category: beveragesCategory._id,
        seller: seller2._id,
        images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 70 }
        ],
        totalStock: 70,
        variations: [
          { name: 'Roast', value: 'Light', priceAdjustment: 0 },
          { name: 'Roast', value: 'Medium', priceAdjustment: 0 },
          { name: 'Roast', value: 'Dark', priceAdjustment: 25 }
        ],
        rating: { average: 4.8, count: 94 },
        soldCount: 167,
        isFeatured: true,
        isFlashSale: false,
        isAvailable: true
      },
      {
        name: 'Strawberry Wine',
        description: 'Sweet wine made from fresh local strawberries',
        price: 450,
        originalPrice: 450,
        discount: 0,
        category: beveragesCategory._id,
        seller: seller2._id,
        images: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500'],
        sizeStock: [
          { size: 'One Size', quantity: 40 }
        ],
        totalStock: 40,
        rating: { average: 4.7, count: 38 },
        soldCount: 45,
        isFeatured: true,
        isFlashSale: false,
        isAvailable: true
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`📦 Products seeded: ${createdProducts.length}`);
    return createdProducts;
  } catch (error) {
    console.error('Error seeding products:', error);
    return [];
  }
};

const seedOrders = async (users, products) => {
  try {
    const client = users.find(u => u.email === 'client@test.com');
    const client2 = users.find(u => u.email === 'jane@client.com');

    const orders = [
      {
        user: client._id,
        items: [
          {
            product: products[0]._id,
            seller: products[0].seller,
            name: products[0].name,
            quantity: 2,
            price: products[0].price,
            size: 'One Size',
            image: products[0].images[0]
          },
          {
            product: products[3]._id,
            seller: products[3].seller,
            name: products[3].name,
            quantity: 1,
            price: products[3].price,
            size: 'One Size',
            variation: { name: 'Wood Type', value: 'Pine' },
            image: products[3].images[0],
            hasReview: true
          }
        ],
        totalAmount: (products[0].price * 2) + products[3].price,
        status: 'delivered',
        shippingAddress: client.address,
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        statusHistory: [
          { status: 'order placed', updatedAt: new Date('2024-11-15'), note: 'Order placed' },
          { status: 'processing', updatedAt: new Date('2024-11-16'), note: 'Order is being processed' },
          { status: 'out for delivery', updatedAt: new Date('2024-11-17'), note: 'Out for delivery' },
          { status: 'delivered', updatedAt: new Date('2024-11-18'), note: 'Successfully delivered' }
        ],
        deliveredAt: new Date('2024-11-18'),
        createdAt: new Date('2024-11-15')
      },
      {
        user: client2._id,
        items: [
          {
            product: products[5]._id,
            seller: products[5].seller,
            name: products[5].name,
            quantity: 1,
            price: products[5].price,
            size: 'M',
            image: products[5].images[0],
            hasReview: true
          },
          {
            product: products[10]._id,
            seller: products[10].seller,
            name: products[10].name,
            quantity: 3,
            price: products[10].price,
            size: 'One Size',
            variation: { name: 'Roast', value: 'Medium' },
            image: products[10].images[0]
          }
        ],
        totalAmount: products[5].price + (products[10].price * 3),
        status: 'delivered',
        shippingAddress: client2.address,
        paymentMethod: 'gcash',
        paymentStatus: 'paid',
        statusHistory: [
          { status: 'order placed', updatedAt: new Date('2024-11-10'), note: 'Order placed' },
          { status: 'processing', updatedAt: new Date('2024-11-11'), note: 'Processing' },
          { status: 'out for delivery', updatedAt: new Date('2024-11-12'), note: 'Out for delivery' },
          { status: 'delivered', updatedAt: new Date('2024-11-13'), note: 'Delivered' }
        ],
        deliveredAt: new Date('2024-11-13'),
        createdAt: new Date('2024-11-10')
      },
      {
        user: client._id,
        items: [
          {
            product: products[1]._id,
            seller: products[1].seller,
            name: products[1].name,
            quantity: 2,
            price: products[1].price,
            size: 'One Size',
            variation: { name: 'Size', value: 'Small (250g)' },
            image: products[1].images[0]
          }
        ],
        totalAmount: products[1].price * 2,
        status: 'out for delivery',
        shippingAddress: client.address,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        statusHistory: [
          { status: 'order placed', updatedAt: new Date('2024-11-20'), note: 'Order placed' },
          { status: 'processing', updatedAt: new Date('2024-11-21'), note: 'Processing' },
          { status: 'out for delivery', updatedAt: new Date('2024-11-22'), note: 'Out for delivery' }
        ],
        createdAt: new Date('2024-11-20')
      },
      {
        user: client2._id,
        items: [
          {
            product: products[6]._id,
            seller: products[6].seller,
            name: products[6].name,
            quantity: 1,
            price: products[6].price,
            size: 'L',
            variation: { name: 'Color', value: 'Blue' },
            image: products[6].images[0]
          }
        ],
        totalAmount: products[6].price,
        status: 'processing',
        shippingAddress: client2.address,
        paymentMethod: 'card',
        paymentStatus: 'pending',
        statusHistory: [
          { status: 'order placed', updatedAt: new Date('2024-11-21'), note: 'Order placed' },
          { status: 'processing', updatedAt: new Date('2024-11-22'), note: 'Processing order' }
        ],
        createdAt: new Date('2024-11-21')
      },
      {
        user: client._id,
        items: [
          {
            product: products[9]._id,
            seller: products[9].seller,
            name: products[9].name,
            quantity: 1,
            price: products[9].price,
            size: 'One Size',
            variation: { name: 'Size', value: '500ml' },
            image: products[9].images[0]
          }
        ],
        totalAmount: products[9].price,
        status: 'order placed',
        shippingAddress: client.address,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        statusHistory: [
          { status: 'order placed', updatedAt: new Date(), note: 'Order has been placed' }
        ],
        createdAt: new Date()
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log(`📋 Orders seeded: ${createdOrders.length}`);
    return createdOrders;
  } catch (error) {
    console.error('Error seeding orders:', error);
    return [];
  }
};

const seedReviews = async (users, products, orders) => {
  try {
    const client = users.find(u => u.email === 'client@test.com');
    const client2 = users.find(u => u.email === 'jane@client.com');
    const seller1 = users.find(u => u.email === 'john@seller.com');

    const reviews = [
      {
        product: products[3]._id,
        user: client._id,
        order: orders[0]._id,
        rating: 5,
        comment: 'Beautiful keychain! Perfect souvenir from Pine City. The craftsmanship is excellent.',
        isVerifiedPurchase: true,
        sellerReply: {
          comment: 'Thank you for your kind words! We\'re glad you loved it!',
          repliedAt: new Date('2024-11-19')
        },
        createdAt: new Date('2024-11-18')
      },
      {
        product: products[5]._id,
        user: client2._id,
        order: orders[1]._id,
        rating: 5,
        comment: 'The basket is stunning! Great quality and arrived safely packaged.',
        isVerifiedPurchase: true,
        sellerReply: {
          comment: 'We appreciate your feedback! Thank you for choosing our products.',
          repliedAt: new Date('2024-11-14')
        },
        createdAt: new Date('2024-11-13')
      },
      {
        product: products[0]._id,
        user: client2._id,
        order: orders[1]._id,
        rating: 4,
        comment: 'Delicious taho! The strawberry flavor is authentic and refreshing.',
        isVerifiedPurchase: true,
        createdAt: new Date('2024-11-14')
      },
      {
        product: products[1]._id,
        user: client._id,
        order: orders[0]._id,
        rating: 5,
        comment: 'Best ube jam I\'ve ever tasted! Will definitely order again.',
        isVerifiedPurchase: true,
        createdAt: new Date('2024-11-19')
      },
      {
        product: products[10]._id,
        user: client2._id,
        order: orders[1]._id,
        rating: 5,
        comment: 'Amazing coffee! Rich flavor and perfect roast. Highly recommended!',
        isVerifiedPurchase: true,
        createdAt: new Date('2024-11-15')
      }
    ];

    const createdReviews = await Review.insertMany(reviews);
    console.log(`⭐ Reviews seeded: ${createdReviews.length}`);
    return createdReviews;
  } catch (error) {
    console.error('Error seeding reviews:', error);
    return [];
  }
};

const seedMessages = async (users, products) => {
  try {
    const client = users.find(u => u.email === 'client@test.com');
    const seller1 = users.find(u => u.email === 'john@seller.com');
    const seller2 = users.find(u => u.email === 'mary@seller.com');

    const conversationId1 = Message.getConversationId(client._id, seller1._id);
    const conversationId2 = Message.getConversationId(client._id, seller2._id);

    const messages = [
      {
        conversation: conversationId1,
        sender: client._id,
        receiver: seller1._id,
        product: products[3]._id,
        message: 'Hi! Is this keychain still available?',
        isRead: true,
        createdAt: new Date('2024-11-14T10:00:00')
      },
      {
        conversation: conversationId1,
        sender: seller1._id,
        receiver: client._id,
        product: products[3]._id,
        message: 'Yes, it is! We have all wood types in stock.',
        isRead: true,
        createdAt: new Date('2024-11-14T10:05:00')
      },
      {
        conversation: conversationId1,
        sender: client._id,
        receiver: seller1._id,
        message: 'Great! What about custom engraving?',
        isRead: true,
        createdAt: new Date('2024-11-14T10:10:00')
      },
      {
        conversation: conversationId1,
        sender: seller1._id,
        receiver: client._id,
        message: 'We can do custom engraving for an additional ₱30. Just let us know what text you want!',
        isRead: true,
        createdAt: new Date('2024-11-14T10:15:00')
      },
      {
        conversation: conversationId2,
        sender: client._id,
        receiver: seller2._id,
        product: products[0]._id,
        message: 'Do you deliver fresh taho daily?',
        isRead: true,
        createdAt: new Date('2024-11-20T08:00:00')
      },
      {
        conversation: conversationId2,
        sender: seller2._id,
        receiver: client._id,
        product: products[0]._id,
        message: 'Yes! We make fresh taho every morning. Orders placed before 10 AM are delivered the same day.',
        isRead: true,
        createdAt: new Date('2024-11-20T08:30:00')
      },
      {
        conversation: conversationId2,
        sender: client._id,
        receiver: seller2._id,
        message: 'Perfect! I\'ll place an order tomorrow morning.',
        isRead: false,
        createdAt: new Date('2024-11-20T09:00:00')
      }
    ];

    const createdMessages = await Message.insertMany(messages);
    console.log(`💬 Messages seeded: ${createdMessages.length}`);
    return createdMessages;
  } catch (error) {
    console.error('Error seeding messages:', error);
    return [];
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    await clearDatabase();

    const users = await seedUsers();
    const categories = await seedCategories();
    const products = await seedProducts(categories, users);
    const orders = await seedOrders(users, products);
    const reviews = await seedReviews(users, products, orders);
    const messages = await seedMessages(users, products);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Orders: ${orders.length}`);
    console.log(`   Reviews: ${reviews.length}`);
    console.log(`   Messages: ${messages.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@pinecitymade.com');
    console.log('     Password: admin123\n');
    console.log('   Sellers:');
    console.log('     Email: john@seller.com | Password: seller123');
    console.log('     Email: mary@seller.com | Password: seller123\n');
    console.log('   Clients:');
    console.log('     Email: client@test.com | Password: client123');
    console.log('     Email: jane@client.com | Password: client123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();