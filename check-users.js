const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./backend/models/User');

async function checkUsers() {
  try {
    const users = await User.find().select('name email role studentId department semester');
    console.log('\n=== Existing Users in Database ===');
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Student ID: ${user.studentId || 'N/A'}`);
      console.log(`   Department: ${user.department || 'N/A'}`);
      console.log(`   Semester: ${user.semester || 'N/A'}`);
      console.log('');
    });
    
    if (users.length === 0) {
      console.log('No users found in database.');
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers(); 