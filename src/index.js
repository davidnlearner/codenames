const path = require('path')
const express = require('express')
const app = require('./app')
const http = require('http')
const socketio = require('socket.io')
const {generateMessage, generateLocationMessage} = require('./utils/messages')  

const port = process.env.PORT || 3000

const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    socket.emit('message', {'username': 'Admin', 'text': 'New Player has joined'})
    
})



server.listen(port, () => {
    console.log('Server is up on port ' + port)
})