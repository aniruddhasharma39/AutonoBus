import mongoose from 'mongoose';
import Assignment from './models/Assignment.js';
import Route from './models/Route.js';

mongoose.connect('mongodb://127.0.0.1:27017/garuda_urbanlines')
  .then(async () => {
    const assignments = await Assignment.find({}).populate('route');
    for (const a of assignments) {
      console.log(`Assignment ID: ${a._id}, journeyDate: ${a.journeyDate}`);
      if (a.route) {
        console.log(`Route: ${a.route.name}`);
        a.route.cities.forEach(c => {
          console.log(`- ${c.cityName}, offset: ${c.dayOffset}`);
        });
      }
    }
    process.exit(0);
  });
