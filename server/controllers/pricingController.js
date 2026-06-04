import Pricing from '../models/Pricing.js';

export const getPricings = async (req, res) => {
  try {
    const pricings = await Pricing.find({}).populate('route');
    res.json(pricings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPricing = async (req, res) => {
  try {
    const pricing = new Pricing(req.body);
    const createdPricing = await pricing.save();
    res.status(201).json(createdPricing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (pricing) res.json(pricing);
    else res.status(404).json({ message: 'Pricing not found' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id);
    if (pricing) {
      await pricing.deleteOne();
      res.json({ message: 'Pricing removed' });
    } else {
      res.status(404).json({ message: 'Pricing not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
