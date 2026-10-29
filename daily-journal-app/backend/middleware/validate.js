const ALLOWED_MOODS = new Set(["Calm", "Happy", "Grateful", "Anxious", "Tired"]);

function validateEntry(req, res, next) {
  const { title = "", content, mood = "Calm", entry_date } = req.body || {};
  if (typeof title !== "string" || title.length > 120) {
    return res.status(400).json({ error: "Title must be text with at most 120 characters." });
  }
  if (typeof content !== "string" || !content.trim() || content.trim().length > 12000) {
    return res.status(400).json({ error: "Content is required and must be at most 12,000 characters." });
  }
  if (!ALLOWED_MOODS.has(mood)) {
    return res.status(400).json({ error: "Choose a valid mood." });
  }
  if (entry_date !== undefined) {
    if (typeof entry_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry_date)) {
      return res.status(400).json({ error: "Entry date must use YYYY-MM-DD format." });
    }
    const parsed = new Date(`${entry_date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== entry_date) {
      return res.status(400).json({ error: "Enter a valid calendar date." });
    }
  }
  req.validatedEntry = {
    title: title.trim() || null,
    content: content.trim(),
    mood,
    ...(entry_date ? { entry_date } : {})
  };
  next();
}

module.exports = { validateEntry };
