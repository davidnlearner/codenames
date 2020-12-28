const express = require('express')
const Game = require('../models/game')
const router = new express.Router()
const Board = require('../models/board')
const boardRouter = require('../routers/board')


router.post('/games/:lobby', async (req, res) => {
    const lobbyName = req.params.lobby

    //Test for duplicate lobby names

    // const test = await Game.find((game) => game.lobbyName === lobbyName)
    // if (test === undefined) {
    //     return res.send('Sorry, lobby name is already in use.')
    // }
    const board = await fetch('/boards', {method: 'POST'})
    console.log(board)
    const game = new Game({
        boardId: board.id,
        players: [],  // To Do: add nickname of player calling post
        lobbyName
    })
    try {
        await game.save()
        res.status(201).send(game)
    } catch (e) {
        res.status(400).send(e)
    }

})

router.get('/games/:id', async (req, res) => {
    const game = await Game.findOne(req.params.id)
    try {
        res.send(game)
    } catch (e) {
        res.status(500).send(e)
    }

})

// Add player  likely needs improvement
router.patch('/games/:id/name', async (req, res) => {
      try{
        const game = await Game.findOne(req.params.id)
        
        if (!game) {
            return res.status(404).send()
        }

        game.players.push(req.params.name)
        await game.save
        res.send(game)
    }catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/games/:id', async (req, res) => {
    try {
        const game = await Game.findOneAndDelete(req.params.id)
        if (!game) {
            res.status(404).send()
        }
        res.send(game)
    } catch (e) {
        res.status(500).send()
    }
})


module.exports = router