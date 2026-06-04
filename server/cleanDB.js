import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/garuda_urbanlines')
  .then(async () => {
    console.log('MongoDB Connected');
    try {
      await mongoose.connection.db.collection('assignments').drop();
      console.log('Dropped assignments collection');
    } catch (e) {
      console.log('Assignments collection does not exist');
    }
    
    try {
      await mongoose.connection.db.collection('schedules').drop();
      console.log('Dropped schedules collection');
    } catch (e) {
      console.log('Schedules collection does not exist');
    }

    try {
      await mongoose.connection.db.collection('bookings').drop();
      console.log('Dropped bookings collection');
    } catch (e) {
      console.log('Bookings collection does not exist');
    }

    console.log('Cleanup complete');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
