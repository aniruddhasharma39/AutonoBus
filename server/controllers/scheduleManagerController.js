import Schedule from '../models/Schedule.js';
import Assignment from '../models/Assignment.js';
import Pricing from '../models/Pricing.js';
import Route from '../models/Route.js';

export const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({}).populate('route');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { route, fromDate, toDate } = req.body;
    
    const routeObj = await Route.findById(route);
    if (!routeObj) {
        return res.status(404).json({ message: 'Route not found' });
    }
    
    // Validate pricing exists for this route
    const pricing = await Pricing.findOne({ route });
    if (!pricing) {
      return res.status(400).json({ message: 'Pricing matrix must be defined for this route before adding a schedule.' });
    }

    // Save master schedule
    const schedule = new Schedule(req.body);
    const createdSchedule = await schedule.save();

    // Generate Assignments for the date range
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const assignments = [];

    // Increment date safely
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      
      // Check if assignment already exists
      const exists = await Assignment.findOne({ route, journeyDate: dateString, busType: routeObj.busType });
      if (!exists) {
        assignments.push({
          route,
          pricing: pricing._id,
          busType: routeObj.busType,
          totalSeats: routeObj.busCapacity,
          bus: null,
          journeyDate: dateString,
          status: 'scheduled',
          bookedSeats: []
        });
      }
    }

    if (assignments.length > 0) {
      await Assignment.insertMany(assignments);
    }

    res.status(201).json(createdSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Find unbooked assignments linked to this schedule's rules and delete them
    // Note: We only delete assignments where bus is null AND no seats are booked.
    // Otherwise we might orphan bookings.
    await Assignment.deleteMany({
      route: schedule.route,
      journeyDate: { $gte: schedule.fromDate, $lte: schedule.toDate },
      bus: null,
      bookedSeats: { $size: 0 }
    });

    await schedule.deleteOne();
    res.json({ message: 'Schedule removed and empty future assignments cleared' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
