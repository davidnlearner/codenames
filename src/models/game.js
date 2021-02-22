const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    lobbyName: {
        type: String,
        required: true,
    },
    playerRoles: {
        type: Array,
        required: true,
        default: []
    },
    activeState: {
        type: String,
        default: 'pregame'
    },
    createdAt: {
        type: Date,
        required: true
    },
    oldWords: {
        type: Array,
        required: true,
        default: []
    }
})

const Game = mongoose.model('Game', gameSchema)

module.exports = Game