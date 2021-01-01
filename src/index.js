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
    socket.on('join', (player, callback) => {

        // Duplicate error stuff originally was here
        // Need to add it somewhere

        socket.join(player.gameId)

        socket.emit('message', generateMessage('Admin', `Welcome ${player.username}!`))
        socket.broadcast.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} has joined!`))

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()

        //bad words filter   good model for filtering clue words
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        const user = getUser(socket.id)

        io.to(player.gameId).emit('message', generateMessage(user.username, message))
        callback()
    })
    
})



server.listen(port, () => {
    console.log('Server is up on port ' + port)
})