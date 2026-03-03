require('dotenv').config()
const app = require("./src/app");
const chalk = require('chalk');
const connectDb = require('./src/config/db');

connectDb()

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(chalk.green(`✅ Server started successfully`));
    console.log(chalk.cyan(`➜  Local: http://localhost:${PORT}`));
});