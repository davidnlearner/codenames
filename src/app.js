const express = require('express')
require('./db/mongoose')
const boardRouter = require('./routers/board')  

const app = express()

app.use(express.json())
app.use(boardRouter)

module.exports = app