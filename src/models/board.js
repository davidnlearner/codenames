const mongoose = require('mongoose')

const boardSchema = new mongoose.Schema({
    wordlist: {
        type: Array,
        required: true
    },
    startingTeam: {
        type: String,
        required: true
    },
    overlay: {
        type: Array,
        required: true,
    }
})
// add game room name?

const Board = mongoose.model('Board', boardSchema)

module.exports = Board