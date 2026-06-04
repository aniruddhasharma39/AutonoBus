import mongoose from 'mongoose';
import Route from './models/Route.js';

mongoose.connect('mongodb://127.0.0.1:27017/garuda_urbanlines')
  .then(async () => {
    const routes = await Route.find({});
    for (const r of routes) {
      console.log(`Route: ${r.name}`);
      r.cities.forEach(c => {
        console.log(`- ${c.cityName}, offset: ${c.dayOffset}`);
      });
    }
    process.exit(0);
  });
