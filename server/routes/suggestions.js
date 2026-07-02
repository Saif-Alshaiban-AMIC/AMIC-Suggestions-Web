const router = require('express').Router();
const Suggestion = require('../models/Suggestion');
const requireAuth = require('../middleware/requireAuth');

// Public: submit suggestion
router.post('/', async (req, res) => {
  try {
    const { employeeName, employeeId, department, category, title, description } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });
    const suggestion = await Suggestion.create({
      employeeName,
      employeeId,
      department,
      category,
      title,
      description,
    });
    res.status(201).json(suggestion);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: get all suggestions
router.get('/', requireAuth, async (req, res) => {
  try {
    const suggestions = await Suggestion.findAll(5000);
    res.json(suggestions);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update status + note
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const suggestion = await Suggestion.updateById(req.params.id, { status, adminNote });
    if (!suggestion) return res.status(404).json({ error: 'Not found' });
    res.json(suggestion);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete one
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Suggestion.deleteById(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: bulk delete
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    await Suggestion.deleteMany(ids);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
