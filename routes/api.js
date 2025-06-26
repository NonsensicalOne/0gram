const { Router } = require("ultimate-express");
const { fetchImage, fetchPosts } = require("../services/instagramService");
const router = Router();

// Proxy an external image URL
router.get("/image", async (req, res, next) => {
  try {
    const { contentType, data } = await fetchImage(req.query.url);
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(data);
  } catch (err) {
    next(err);
  }
});

// Fetch user posts
router.get("/:username/posts", async (req, res, next) => {
  try {
    const { username } = req.params;
    const { after } = req.query;
    const result = await fetchPosts(username, after);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
