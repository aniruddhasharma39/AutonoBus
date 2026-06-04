import mongoose from 'mongoose';

const cityStopSchema = new mongoose.Schema({
  cityName: { type: String, required: true },
  sequenceOrder: { type: Number, required: true },
  isBoarding: { type: Boolean, default: true },
  isDropping: { type: Boolean, default: true },
  boardingPoints: [{ location: String, time: String }],
  droppingPoints: [{ location: String, time: String }],
  dayOffset: { type: Number, default: 0 } // 0 = Same day, 1 = Next day, etc.
});

const routeSchema = new mongoose.Schema({
  name: { type: String }, // Automatically generated e.g. "Mumbai - Delhi"
  serviceName: { type: String, required: true, default: 'UrbanLines' }, // e.g. "UrbanLines by Garuda"
  busType: { type: String, required: true, default: '2x1 Deluxe AC Sleeper' }, // e.g. "2x1 Deluxe AC Sleeper"
  busCapacity: { type: Number, required: true, default: 30 }, // 30, 36, or 42
  cities: [cityStopSchema],
  distance: { type: Number }, // Total distance
  estimatedDuration: { type: Number } // Total estimated duration in minutes
}, { timestamps: true });

// Basic Validation Hook before saving
routeSchema.pre('save', async function(next) {
  if (this.cities && this.cities.length >= 2) {
    // Sort just to be safe
    this.cities.sort((a,b) => a.sequenceOrder - b.sequenceOrder);
    
    // First city cannot be dropping
    this.cities[0].isDropping = false;
    this.cities[0].droppingPoints = [];
    
    // Last city cannot be boarding
    const lastIdx = this.cities.length - 1;
    this.cities[lastIdx].isBoarding = false;
    this.cities[lastIdx].boardingPoints = [];

    // Automatically generate the route name if not present or overriding
    let timeStr = '00:00';
    if (this.cities[0].boardingPoints && this.cities[0].boardingPoints.length > 0) {
      timeStr = this.cities[0].boardingPoints[0].time || '00:00';
    }
    const baseName = `${this.cities[0].cityName} - ${this.cities[lastIdx].cityName} - ${timeStr}`;
    
    if (this.isModified('cities') || this.isNew) {
      let uniqueName = baseName;
      let counter = 1;
      let existingRoute = await this.constructor.findOne({ name: uniqueName, _id: { $ne: this._id } });
      
      while (existingRoute) {
        uniqueName = `${baseName} - ${counter}`;
        counter++;
        existingRoute = await this.constructor.findOne({ name: uniqueName, _id: { $ne: this._id } });
      }
      this.name = uniqueName;
    }
  }
  next();
});

const Route = mongoose.model('Route', routeSchema);
export default Route;
