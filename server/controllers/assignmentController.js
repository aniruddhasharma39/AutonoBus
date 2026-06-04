import Assignment from '../models/Assignment.js';
import Bus from '../models/Bus.js';
import Booking from '../models/Booking.js';

export const getAssignments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) {
      filter.journeyDate = req.query.date;
    }
    const assignments = await Assignment.find(filter).populate('route bus pricing');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    const createdAssignment = await assignment.save();
    res.status(201).json(createdAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (assignment) res.json(assignment);
    else res.status(404).json({ message: 'Assignment not found' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (assignment) {
      await assignment.deleteOne();
      res.json({ message: 'Assignment removed' });
    } else {
      res.status(404).json({ message: 'Assignment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a specific vehicle to this date's assignment
export const assignBus = async (req, res) => {
  try {
    const { busId } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    // Validate bus type matches the schedule config
    if (bus.type !== assignment.busType) {
      return res.status(400).json({ message: `Cannot assign. Expected Bus Type ${assignment.busType}, but got ${bus.type}.` });
    }

    assignment.bus = bus._id;
    await assignment.save();
    
    const updated = await Assignment.findById(req.params.id).populate('route bus pricing');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manage an unbooked seat (block, unblock)
export const manageSeat = async (req, res) => {
  try {
    const { seatNumber, action } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const seatIndex = assignment.bookedSeats.findIndex(s => s.seatNumber === seatNumber);

    if (action === 'block') {
      if (seatIndex !== -1) return res.status(400).json({ message: 'Seat is currently occupied.' });
      assignment.bookedSeats.push({ seatNumber, status: 'locked' });
    } else if (action === 'unblock') {
      if (seatIndex !== -1 && assignment.bookedSeats[seatIndex].status === 'locked') {
        assignment.bookedSeats.splice(seatIndex, 1);
      }
    }

    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reassign a booked seat
export const reassignSeat = async (req, res) => {
  try {
    const { oldSeatNumber, newSeatNumber } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const oldSeatIndex = assignment.bookedSeats.findIndex(s => s.seatNumber === oldSeatNumber);
    if (oldSeatIndex === -1 || assignment.bookedSeats[oldSeatIndex].status !== 'booked') {
      return res.status(400).json({ message: 'Original seat is not booked.' });
    }

    if (assignment.bookedSeats.some(s => s.seatNumber === newSeatNumber)) {
      return res.status(400).json({ message: 'New seat is already occupied.' });
    }

    const oldSeat = assignment.bookedSeats[oldSeatIndex];
    oldSeat.seatNumber = newSeatNumber;
    await assignment.save();

    // Trace back to Booking collection and update
    if (oldSeat.bookingId) {
       const booking = await Booking.findById(oldSeat.bookingId);
       if (booking) {
           const bSeat = booking.seats.find(s => s.seatNumber === oldSeatNumber);
           if (bSeat) bSeat.seatNumber = newSeatNumber;
           await booking.save();
       }
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a booked seat
export const cancelSeat = async (req, res) => {
  try {
    const { seatNumber } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const seatIndex = assignment.bookedSeats.findIndex(s => s.seatNumber === seatNumber);
    if (seatIndex === -1 || assignment.bookedSeats[seatIndex].status !== 'booked') {
      return res.status(400).json({ message: 'Seat is not found or not booked.' });
    }

    const oldSeat = assignment.bookedSeats[seatIndex];
    assignment.bookedSeats.splice(seatIndex, 1);
    await assignment.save();

    if (oldSeat.bookingId) {
      const booking = await Booking.findById(oldSeat.bookingId);
      if (booking) {
          booking.seats = booking.seats.filter(s => s.seatNumber !== seatNumber);
          if (booking.seats.length === 0) booking.status = 'cancelled';
          // Reduce total Amount? Simplified: just let it stay for audit but seat is gone.
          await booking.save();
      }
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
