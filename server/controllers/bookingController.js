import Booking from '../models/Booking.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import Counter from '../models/Counter.js';
import { sendTicket } from '../utils/emailService.js';

import Pricing from '../models/Pricing.js';

// Helper to get auto-incrementing PNR
const getNextPnr = async () => {
  const counter = await Counter.findOneAndUpdate(
    { id: 'pnr' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const pnrNum = 999 + counter.seq;
  return `GL${pnrNum}`; // e.g., GL1001
};

// @desc    Create new booking with concurrency control
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  const { assignmentId, seats, totalAmount, boardingPoint, droppingPoint, sourceCity, destinationCity } = req.body;

  if (!seats || seats.length === 0) {
    return res.status(400).json({ message: 'No seats selected' });
  }

  if (seats.length > 6) {
    return res.status(400).json({ message: 'Maximum 6 seats allowed per booking' });
  }

  try {
    const seatNumbers = seats.map(s => s.seatNumber);

    // Validate Pricing
    const validationAssignment = await Assignment.findById(assignmentId);
    if (!validationAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const pricing = await Pricing.findOne({
       $or: [
         { _id: validationAssignment.pricing },
         { route: validationAssignment.route }
       ]
    });
    
    if (!pricing || !pricing.priceMatrix) {
       return res.status(400).json({ message: 'Pricing not configured for this route' });
    }

    const priceObj = pricing.priceMatrix.find(p => p.source.toLowerCase() === sourceCity?.toLowerCase() && p.destination.toLowerCase() === destinationCity?.toLowerCase());
    const basePrice = priceObj ? priceObj.priceSleeper : 1000;

    let expectedTotal = 0;
    for (const seat of seats) {
      let seatPrice = basePrice;
      if (pricing.dynamicPricing && pricing.dynamicPricing.length > 0) {
        const dp = pricing.dynamicPricing.find(d => d.seatId === seat.seatNumber);
        if (dp) {
          seatPrice += dp.offset;
        }
      }
      expectedTotal += seatPrice;
    }

    if (Math.abs(expectedTotal - totalAmount) > 0.01) {
      return res.status(400).json({ message: `Price mismatch. Expected ${expectedTotal}, got ${totalAmount}` });
    }

    // Atomically check and lock seats in the Assignment
    // We only update if NONE of the requested seats are already in the bookedSeats array
    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: assignmentId,
        'bookedSeats.seatNumber': { $nin: seatNumbers }
      },
      {
        $push: {
          bookedSeats: {
            $each: seats.map(seatObj => ({
              seatNumber: seatObj.seatNumber,
              status: 'booked',
              passengerName: seatObj.passengerName,
              age: seatObj.age,
              gender: seatObj.gender,
              boardingPoint,
              droppingPoint
            }))
          }
        }
      },
      { new: true }
    );

    if (!assignment) {
      // If assignment is null, it means either the assignment doesn't exist, OR one of the seats is already booked
      return res.status(409).json({ message: 'One or more selected seats have already been booked by someone else. Please select different seats.' });
    }

    // Generate PNR
    const pnr = await getNextPnr();

    // Create the booking
    const booking = new Booking({
      user: req.user._id,
      assignment: assignmentId,
      pnr,
      seats,
      totalAmount,
      boardingPoint,
      droppingPoint,
      status: 'confirmed'
    });

    const savedBooking = await booking.save();

    // Update the assignment with the bookingId for the newly added seats
    // This is optional but good for data integrity
    await Assignment.updateOne(
      { _id: assignmentId },
      { $set: { 'bookedSeats.$[elem].bookingId': savedBooking._id } },
      { arrayFilters: [{ 'elem.seatNumber': { $in: seatNumbers } }] }
    );

    try {
      const userObj = await User.findById(req.user._id);
      if (userObj && userObj.email) {
        const populatedBooking = await Booking.findById(savedBooking._id).populate({
          path: 'assignment',
          populate: [
            { path: 'route', model: 'Route' },
            { path: 'bus', model: 'Bus' }
          ]
        });
        sendTicket(userObj.email, populatedBooking).catch(err => console.error('Email send error:', err));
      }
    } catch (err) {
      console.error('Failed to prepare ticket email:', err);
    }

    res.status(201).json(savedBooking);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/mybookings
// @access  Private
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'assignment',
        populate: [
          { path: 'route', model: 'Route' },
          { path: 'bus', model: 'Bus' }
        ]
      })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save a passenger to user profile
// @route   POST /api/bookings/passengers
// @access  Private
export const savePassenger = async (req, res) => {
  try {
    const { name, age, gender } = req.body;
    
    // Use name as unique identifier inside savedPassengers array
    const user = await User.findById(req.user._id);
    
    if (user) {
      // Find existing
      const existingPassengerIndex = user.savedPassengers.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
      
      if (existingPassengerIndex >= 0) {
        // Update existing
        user.savedPassengers[existingPassengerIndex].age = age;
        user.savedPassengers[existingPassengerIndex].gender = gender;
      } else {
        // Add new
        user.savedPassengers.push({ name, age, gender });
      }
      
      await user.save();
      res.json(user.savedPassengers);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get saved passengers
// @route   GET /api/bookings/passengers
// @access  Private
export const getSavedPassengers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user.savedPassengers || []);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
