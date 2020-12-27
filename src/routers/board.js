const express = require('express')
const Board = require('../models/board')
const router = new express.Router()
const { newWords, newOverlay } = require('../utils/gameSetup')


router.post('/boards', async (req, res) => {
    const board = new Board({
        wordlist: newWords(),
        overlay: newOverlay()
    })
    try{
        await board.save()
        res.status(201).send(board)
    } catch (e) {
        res.status(400).send(e)
    }
})

// router.get('/boards', (req, res) => {
//     res.send('i work')
// })

router.get('/boards/:id/wordlist', async (req, res) => {
    const board = await Board.findOne({ _id: req.params.id })
    try {
        res.send(board.wordlist)  //revise later for specific game's board
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/boards/:id/overlay', async (req, res) => {
    const board = await Board.findOne({ _id: req.params.id })
    try {
        res.send(board.overlay)  //revise later for specific game's board
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router