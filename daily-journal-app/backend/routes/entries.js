const express = require("express");
const supabase = require("../supabase");
const { validateEntry } = require("../middleware/validate");

const router = express.Router();
const FIELDS = "id,title,content,mood,entry_date,created_at,updated_at";

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("journal_entries").select(FIELDS).order("entry_date", { ascending: false })
      .order("updated_at", { ascending: false }).limit(500);
    if (error) throw error;
    res.json({ entries: data });
  } catch (error) { next(error); }
});

router.post("/", validateEntry, async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("journal_entries")
      .insert(req.validatedEntry).select(FIELDS).single();
    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "An entry already exists for this date. Edit that entry instead." });
      throw error;
    }
    res.status(201).json({ entry: data });
  } catch (error) { next(error); }
});

router.put("/:id", validateEntry, async (req, res, next) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid entry ID." });
    }
    const { data, error } = await supabase.from("journal_entries")
      .update(req.validatedEntry).eq("id", req.params.id).select(FIELDS).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Journal entry not found." });
    res.json({ entry: data });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid entry ID." });
    }
    const { data, error } = await supabase.from("journal_entries")
      .delete().eq("id", req.params.id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Journal entry not found." });
    res.json({ message: "Entry deleted successfully." });
  } catch (error) { next(error); }
});

module.exports = router;
