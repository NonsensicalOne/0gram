const { Router } = require("ultimate-express");
const { fetchProfile } = require("../services/instagramService");
const router = Router();

// Home view
router.get("/", (req, res) => {
  if (req.query.username) return res.redirect(`/${req.query.username}`);
  res.render("home");
});

// Profile view
router.get("/:username", async (req, res, next) => {
  try {
    const userData = await fetchProfile(req.params.username);
    res.render("profile", { user: userData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
