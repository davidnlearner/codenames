const path = require('path')
const express = require('express')
const app = require('./app')
const http = require('http')
const socketio = require('socket.io')

//const {generateMessage, generateLocationMessage} = require('./utils/messages')  FOR COMPARISON PURPOSES
//const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users') FOR COMPARISON PURPOSES

const port = process.env.PORT || 3000

const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

/*
io.on('connection', (socket) => {
    console.log('New Websocket connection')

    socket.on('join', ({ username, lobbyName}, callback) => {
        const {error, user } = addUser({ id: socket.id, username, room})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', `Welcome ${user.username}!`))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

*/









server.listen(port, () => {
    console.log('Server is up on port ' + port)
})