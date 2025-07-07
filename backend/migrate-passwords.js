const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected for password migration'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import User model
const User = require('./models/User');

async function migratePasswords() {
  try {
    console.log('Starting password migration...');
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`Skipping user ${user.email} - password already hashed`);
        skippedCount++;
        continue;
      }
      
      // Hash the plain text password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      // Update the user with hashed password
      await User.findByIdAndUpdate(user._id, { password: hashedPassword });
      
      console.log(`Migrated password for user: ${user.email}`);
      migratedCount++;
    }
    
    console.log(`\nMigration completed!`);
    console.log(`Migrated: ${migratedCount} users`);
    console.log(`Skipped: ${skippedCount} users (already hashed)`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration
migratePasswords(); 