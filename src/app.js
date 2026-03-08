const express = require('express')
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRouter = require("./routes/transaction.routes")
const cookieParser = require('cookie-parser')

const app = express()

// basic middleware
app.use(express.json())
app.use(cookieParser())

// auth route
app.use("/api/auth", authRouter)

// account route
app.use("/api/accounts", accountRouter)

// transaction route
app.use("/api/transactions",transactionRouter)

module.exports = app;