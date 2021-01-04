const express = require('express')
const router = new express.Router()
const Game = require('../models/game')
const Board = require('../models/board')
const Player = require('../models/player')


router.post('/games', async (req, res) => {
    const lobbyName = req.body.lobbyName

    const game = new Game({
        lobbyName
    })

    try {
        await game.save()
        res.status(201).send(game)
    } catch (e) {
        res.status(400).send(e)
    }

})

router.get('/games', async (req, res) => {
    const game = await Game.find()
    try {
        res.send(game)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/games/:id', async (req, res) => {
    const game = await Game.findOne({_id: req.params.id})
    try {
        res.send(game)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/games/lobby/:lobbyName', async (req, res) => {
    const game = await Game.findOne({lobbyName: req.params.lobbyName})
    try {
        if(!game) {
            return res.send({msg: 'no game found'})
        }
        res.send(game)
    } catch (e) {
        res.status(500).send(e)
    }
})

//Gets all players in game
router.get('/games/:id/players', async (req, res) => {
    const game = await Game.findOne({lobbyName: req.params.lobbyName})
    try {
        if(!game) {
            return res.send({msg: 'no game found'})
        }
        const players = await Player.find({gameId: game._id})
        res.send(players)
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
        const game = await Game.findOneAndDelete({_id: req.params.id})
        if (!game) {
            res.status(404).send()
        }
        await Board.deleteMany({gameId: game._id})
        res.send(game)
    } catch (e) {
       res.status(500).send()
   }
})


module.exports = router