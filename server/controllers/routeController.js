import Route from '../models/Route.js';

export const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({});
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRoute = async (req, res) => {
  try {
    const route = new Route(req.body);
    const createdRoute = await route.save();
    res.status(201).json(createdRoute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (route) {
      route.set(req.body);
      const updatedRoute = await route.save();
      res.json(updatedRoute);
    } else {
      res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (route) {
      await route.deleteOne();
      res.json({ message: 'Route removed' });
    } else {
      res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
