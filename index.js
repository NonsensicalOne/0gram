const express = require('ultimate-express');
const path = require('path');
const { json, urlencoded } = express;

const headers = require('./config/headers');
const apiRouter = require('./routes/api');
const profileRouter = require('./routes/profile');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Favicon route
app.get('/favicon.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.png'));
});

// Mount routers
app.use('/api', apiRouter);
app.use('/', profileRouter);

// 404 handler
app.use(notFound);
// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});