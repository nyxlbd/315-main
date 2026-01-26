const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'john@seller.com' });
  if (!user) {
    console.log('No user found with email john@seller.com');
  } else {
    console.log('User found:', {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      password: user.password,
    });
  }
  process.exit(0);
};

main();
