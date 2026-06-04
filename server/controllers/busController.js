import Bus from '../models/Bus.js';

// @desc    Get all buses
// @route   GET /api/buses
// @access  Public
export const getBuses = async (req, res) => {
  try {
    const buses = await Bus.find({});
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a bus
// @route   POST /api/buses
// @access  Private/Admin
export const createBus = async (req, res) => {
  try {
    const bus = new Bus(req.body);
    const createdBus = await bus.save();
    res.status(201).json(createdBus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a bus
// @route   PUT /api/buses/:id
// @access  Private/Admin
export const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (bus) res.json(bus);
    else res.status(404).json({ message: 'Bus not found' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a bus
// @route   DELETE /api/buses/:id
// @access  Private/Admin
export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (bus) {
      await bus.deleteOne();
      res.json({ message: 'Bus removed' });
    } else {
      res.status(404).json({ message: 'Bus not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
