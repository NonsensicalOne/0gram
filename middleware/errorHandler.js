module.exports.notFound = (req, res) => {
  res.status(404).json({ error: "Route not found" });
};

// eslint-disable-next-line no-unused-vars
module.exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
};
