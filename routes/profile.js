const { Router } = require("ultimate-express");
const { fetchProfile, fetchComments } = require("../services/instagramService");
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
    if (err.status === 404) {
      return res.status(404).render("404", { url: req.originalUrl });
    }
    next(err);
  }
});

// Post view
router.get("/post/:id", async (req, res, next) => {
  try {
    const commentsData = await fetchComments(req.params.id);

    res.render("post", { comments: commentsData });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).render("404", { url: req.originalUrl });
    }
    next(err);
  }
});

module.exports = router;
