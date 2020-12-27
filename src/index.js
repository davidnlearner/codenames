const path = require('path')
const express = require('express')
const app = require('./app')
const port = process.env.PORT || 3000

//const http = require('http')
//const server = http.createServer(app)
//const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})