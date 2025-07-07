const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Result = require('./backend/models/Result');

async function updateResultDates() {
  try {
    console.log('Checking for results without dates...');
    
    // Find results that don't have dateAchieved
    const resultsWithoutDates = await Result.find({ dateAchieved: { $exists: false } });
    
    if (resultsWithoutDates.length === 0) {
      console.log('All results already have dates!');
      return;
    }
    
    console.log(`Found ${resultsWithoutDates.length} results without dates. Updating...`);
    
    // Update each result with current date
    for (const result of resultsWithoutDates) {
      await Result.findByIdAndUpdate(result._id, {
        dateAchieved: new Date()
      });
    }
    
    console.log('Successfully updated all results with dates!');
    
  } catch (error) {
    console.error('Error updating result dates:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateResultDates(); 