const app = require('./app');
const { getConfig } = require('./config/environment');

const config = getConfig();
const port = config.port;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
