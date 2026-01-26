// Script to migrate products to new variations/options/sizes structure
// Usage: node migrateProductVariations.js (run in your Server folder with MongoDB connection)

const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/YOUR_DB_NAME'; // <-- Change to your DB name

const productSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const Product = mongoose.model('Product', productSchema);

async function migrate() {
  await mongoose.connect(uri);
  const products = await Product.find({ sizeStock: { $exists: true, $ne: [] } });
  let updated = 0;
  for (const product of products) {
    // Only migrate if variations exist and do not already have options
    if (Array.isArray(product.variations) && product.variations.length > 0 && !product.variations[0].options) {
      const sizes = Array.isArray(product.sizeStock) ? product.sizeStock.map(s => ({ size: s.size, quantity: s.quantity })) : [];
      product.variations = product.variations.map(variation => ({
        ...variation,
        options: [
          {
            name: 'Default',
            sizes: sizes
          }
        ]
      }));
      product.sizeStock = [];
      await product.save();
      updated++;
      console.log(`Migrated product: ${product._id}`);
    }
  }
  console.log(`Migration complete. Updated ${updated} products.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
