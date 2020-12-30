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
        required: true,
        default: ''
    },
    role: {
        type: String,
        required: true,
        default: ''
    }
})

const Player = mongoose.model('Player', playerSchema)

module.exports = Player