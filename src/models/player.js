const mongoose = require('mongoose')

const playerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    gameId: {
        type: String,
        required: true,
    },
    team: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        default: 'guesser'
    },
    socketId: {
        type: String,
        required: true
    }
})

const Player = mongoose.model('Player', playerSchema)

module.exports = Player