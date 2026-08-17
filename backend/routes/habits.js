import express from 'express';
import Habit from '../models/Habit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/habits
// @desc    Get all habits for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/habits
// @desc    Create a habit
router.post('/', auth, async (req, res) => {
  const { title, icon, color, frequency, category } = req.body;

  try {
    const newHabit = new Habit({
      userId: req.user.id,
      title,
      icon,
      color,
      frequency,
      category,
      history: {},
      streak: 0
    });

    const habit = await newHabit.save();
    res.json(habit);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/habits/:id
// @desc    Update a habit (title, icon, color, frequency, or toggle completion)
router.put('/:id', auth, async (req, res) => {
  const { title, icon, color, frequency, category, history, streak } = req.body;

  // Build habit object
  const habitFields = {};
  if (title) habitFields.title = title;
  if (icon) habitFields.icon = icon;
  if (color) habitFields.color = color;
  if (frequency) habitFields.frequency = frequency;
  if (category) habitFields.category = category;
  if (history !== undefined) habitFields.history = history;
  if (streak !== undefined) habitFields.streak = streak;

  try {
    let habit = await Habit.findById(req.params.id);

    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    // Make sure user owns habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    habit = await Habit.findByIdAndUpdate(
      req.params.id,
      { $set: habitFields },
      { returnDocument: 'after' }
    );

    res.json(habit);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/habits/:id
// @desc    Delete a habit
router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    // Make sure user owns habit
    if (habit.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Habit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Habit removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
