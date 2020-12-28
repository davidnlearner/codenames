const express = require('express')
require('./db/mongoose')
const boardRouter = require('./routers/board')
const gameRouter = require('./routers/game')  


const app = express()

app.use(express.json())
app.use(boardRouter)
app.use(gameRouter)

module.exports = app