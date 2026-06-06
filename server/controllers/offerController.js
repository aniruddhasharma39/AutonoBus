import Offer from '../models/Offer.js';
import Booking from '../models/Booking.js';

// @desc    Create a new offer
// @route   POST /api/offers
// @access  Private/Admin
export const createOffer = async (req, res) => {
  try {
    const { code, title, description, bannerImageUrl, isFirstJourneyOnly,
            applicableRoutes, discountType, discountValue, validFrom,
            validUntil, termsAndConditions, isActive } = req.body;

    const offer = await Offer.create({
      code: code.toUpperCase().trim(),
      title, description, bannerImageUrl,
      isFirstJourneyOnly: isFirstJourneyOnly || false,
      applicableRoutes: applicableRoutes || [],
      discountType, discountValue,
      validFrom, validUntil,
      termsAndConditions,
      isActive: isActive !== undefined ? isActive : true
    });
    res.status(201).json(offer);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Offer code already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all offers
// @route   GET /api/offers
// @access  Private/Admin
export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().populate('applicableRoutes', 'name serviceName').sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an offer
// @route   PUT /api/offers/:id
// @access  Private/Admin
export const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const { code, title, description, bannerImageUrl, isFirstJourneyOnly,
            applicableRoutes, discountType, discountValue, validFrom,
            validUntil, termsAndConditions, isActive } = req.body;

    if (code) offer.code = code.toUpperCase().trim();
    if (title !== undefined) offer.title = title;
    if (description !== undefined) offer.description = description;
    if (bannerImageUrl !== undefined) offer.bannerImageUrl = bannerImageUrl;
    if (isFirstJourneyOnly !== undefined) offer.isFirstJourneyOnly = isFirstJourneyOnly;
    if (applicableRoutes !== undefined) offer.applicableRoutes = applicableRoutes;
    if (discountType !== undefined) offer.discountType = discountType;
    if (discountValue !== undefined) offer.discountValue = discountValue;
    if (validFrom !== undefined) offer.validFrom = validFrom;
    if (validUntil !== undefined) offer.validUntil = validUntil;
    if (termsAndConditions !== undefined) offer.termsAndConditions = termsAndConditions;
    if (isActive !== undefined) offer.isActive = isActive;

    const updated = await offer.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    await offer.deleteOne();
    res.json({ message: 'Offer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate a coupon code (server-side, no redemption here)
// @route   POST /api/offers/validate
// @access  Private
export const validateCoupon = async (req, res) => {
  try {
    const { code, routeId, totalAmount } = req.body;
    const userId = req.user._id;

    const offer = await Offer.findOne({ code: code.toUpperCase().trim() });

    if (!offer) return res.status(404).json({ message: 'Coupon code not found' });
    if (!offer.isActive) return res.status(400).json({ message: 'This offer is no longer active' });

    const now = new Date();
    if (now < new Date(offer.validFrom)) return res.status(400).json({ message: 'This offer has not started yet' });
    if (now > new Date(offer.validUntil)) return res.status(400).json({ message: 'This offer has expired' });

    // Check if user already used this offer
    const alreadyUsed = offer.usedBy.some(u => u.user.toString() === userId.toString());
    if (alreadyUsed) return res.status(400).json({ message: 'You have already used this offer' });

    // First journey check
    if (offer.isFirstJourneyOnly) {
      const priorBookings = await Booking.countDocuments({ user: userId, status: 'confirmed' });
      if (priorBookings > 0) return res.status(400).json({ message: 'This offer is valid only for your first booking' });
    }

    // Route restriction check
    if (offer.applicableRoutes && offer.applicableRoutes.length > 0 && routeId) {
      const validRoute = offer.applicableRoutes.some(r => r.toString() === routeId.toString());
      if (!validRoute) return res.status(400).json({ message: 'This offer is not valid for the selected route' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (offer.discountType === 'percentage') {
      discountAmount = Math.round((totalAmount * offer.discountValue) / 100);
    } else {
      discountAmount = Math.min(offer.discountValue, totalAmount);
    }
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    res.json({
      valid: true,
      offerTitle: offer.title,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      discountAmount,
      finalAmount,
      code: offer.code
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
