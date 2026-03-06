const express = require('express')
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const cookieParser = require('cookie-parser')

const app = express()

// basic middleware
app.use(express.json())
app.use(cookieParser())

// auth route
app.use("/api/auth", authRouter)

// account route
app.use("/api/accounts", accountRouter)

module.exports = app;