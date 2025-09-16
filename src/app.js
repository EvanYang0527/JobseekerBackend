const express = require('express');
const cors = require('cors');
const { getConfig } = require('./config/environment');
const ragflowRoutes = require('./routes/ragflowRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const config = getConfig();

const corsOptions = {
  origin: config.cors.allowedOrigins.length > 0 ? config.cors.allowedOrigins : true,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/ragflow', ragflowRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
