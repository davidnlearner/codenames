const express = require('express')
require('./db/mongoose')
const boardRouter = require('./routers/board')
const gameRouter = require('./routers/game')  
const playerRouter = require('./routers/player')  


const app = express()
const bodyParser = require('body-parser');

// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json())
app.use(boardRouter)
app.use(gameRouter)
app.use(playerRouter)


module.exports = app