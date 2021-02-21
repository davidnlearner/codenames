const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    lobbyName: {
        type: String,
        required: true,
    },
    score: {
        type: Array,
        required: true,
        default: [0,0]
    },
    currentRound: {
        type: Number,
        required: true,
        default: 0
    },
    playerRoles: {
        type: Array,
        required: true,
        default: []
    },
    activeState: {
        type: String,
        default: 'pregame'
    }
})

const Game = mongoose.model('Game', gameSchema)

module.exports = Game