const express = require('express');
const ragflowController = require('../controllers/ragflowController');

const router = express.Router();

router.post('/query', ragflowController.runQuery);
router.get('/datasets', ragflowController.listDatasets);

module.exports = router;
