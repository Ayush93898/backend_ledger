const mongoose = require("mongoose");
const chalk = require("chalk");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(chalk.green(`✅ MongoDB Connected Successfully`));
    console.log(chalk.cyan(`➜  DB: ${mongoose.connection.name}`));
  } catch (err) {
    console.log(chalk.red(`❌ MongoDB Connection Failed`));
    console.log(chalk.red(`➜  Error: ${err.message}`));
    process.exit(1);
  }
};

module.exports = connectDb;
