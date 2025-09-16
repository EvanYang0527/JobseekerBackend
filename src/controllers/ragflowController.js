const ragflowService = require('../services/ragflowService');

async function runQuery(req, res, next) {
  try {
    const response = await ragflowService.runQuery(req.body);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

async function listDatasets(_req, res, next) {
  try {
    const response = await ragflowService.listDatasets();
    res.json(response);
  } catch (error) {
    next(error);
  }
}

async function generateWoopReport(req, res, next) {
  try {
    const response = await ragflowService.generateWoopReport(req.body);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  runQuery,
  listDatasets,
  generateWoopReport,
};
