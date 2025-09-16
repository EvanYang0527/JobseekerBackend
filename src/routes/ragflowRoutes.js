const express = require('express');
const ragflowController = require('../controllers/ragflowController');

const router = express.Router();

router.post('/query', ragflowController.runQuery);
router.get('/datasets', ragflowController.listDatasets);
router.post('/woop', ragflowController.generateWoopReport);

module.exports = router;
