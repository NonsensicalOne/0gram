module.exports.notFound = (req, res) => {
  res.status(404).render("404", { url: req.originalUrl });
};

// eslint-disable-next-line no-unused-vars
module.exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
};
