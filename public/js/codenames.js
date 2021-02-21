const socket = io()

//Sounds
const endTurnSound = new Audio("/sounds/end-turn.wav")
const victorySound = new Audio("/sounds/victory.wav")
victorySound.volume = .4
const correctGuessSound = new Audio("/sounds/correct-guess.wav")


// Elements
const $boardContainer = document.querySelector("#board-container")
const $messages = document.querySelector('#messages')

const $clueForm = document.querySelector('#clue-form')
const $clueFormInput = $clueForm.querySelectorAll('input')
const $clueFormButton = $clueForm.querySelector('button')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const guessMessageTemplate = document.querySelector('#guess-message-template').innerHTML
const clueMessageTemplate = document.querySelector('#clue-message-template').innerHTML
const roleMessageTemplate = document.querySelector('#new-role-message-template').innerHTML


// Options
const { username, lobbyName } = Qs.parse(location.search, { ignoreQueryPrefix: true })

let currentGuesses = -1
let guessEnabled = false


// Calls current board from database and displays
// Can be made into an import
const generateBoard = async (boardId) => {
    clearBoard()
    const response = await fetch(`/boards/wordlist/${boardId}`)
    const data = await response.json()

    // Saves startTeam in session storage
    sessionStorage.setItem('startTeam', data.startTeam)
    sessionStorage.setItem('wordlist', data.wordlist)

    // Adds a card for each word to html
    data.wordlist.forEach((word) => {
        const node = document.createElement('div')
        node.className = "card"
        node.id = `${word.replace(' ', '_')}-card-id`
        node.setAttribute(`revealed`, 'false')
        node.innerHTML = `<div class='card-word'><span>${word}</span></div>`
        $boardContainer.appendChild(node)
    });

    data.revealedCards.forEach( (cardData) => {
        const card = document.querySelector(`#${cardData.word.replace(' ', '_')}-card-id`)
        card.classList.add(`${cardData.cardTeam}-card`)
        card.setAttribute(`revealed`, 'true')
    })

    $('.card').on('click', function () {
        const element = $(this)
        if (element.attr('revealed') === 'false' && guessEnabled) {
            guessEnabled = false
            cardEvent(element.text())
        }
    })
}



// Adds team colors to cards
// Can be made into an import
// Might need cleanup due to limited usage
const addBoardOverlay = async (boardId) => {
    const response = await fetch(`/boards/overlay/${boardId}`)
    const data = await response.json()

    const $boardCards = $boardContainer.querySelectorAll('.card')

    $boardCards.forEach((card, i) => {
        card.classList.add(`${data.overlay[i]}-card`)
    })

}


// Removes board from HTML
// Can be made into an import
// Doesn't remove from database or change boardId in session Storage
const clearBoard = () => { $boardContainer.innerHTML = '' }


// Creates a new board and returns it
// Can be made into an import
const newBoard = async (gameId) => {
    const oldWords = sessionStorage.getItem('wordlist') || []
    const boardRaw = await fetch(`/boards`, { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, oldWords }) })
    const board = await boardRaw.json()
    return board
}

// Creates and returns a new game and board
// Can be made into an import
const newGame = async (lobbyName) => {
    // Creates new game 'lobbyName'
    const gameRaw = await fetch(`/games`, { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lobbyName }) })
    const game = await gameRaw.json()

    const board = await newBoard(game._id)

    return { game, board }
}


// Gets and Returns existing game and board or returns newGame
// Can be made into an import
const getGameData = async (lobbyName) => {
    // Looks for game with name 'lobbyName'
    const gameRaw = await fetch(`/games/lobby/${lobbyName}`)
    const game = await gameRaw.json()

    // If there is game 'lobbyName' in database returns a new game, 
    // else gets current game board and returns the game with the board
    if (game.msg === 'no game found') {
        return newGame(lobbyName)
    } 
    else {
        const boardRaw = await fetch(`/boards/game/${game._id}`)
        const board = await boardRaw.json()

        return { game, board }
    }
}


// Starting function
const joinGame = async (username, lobbyName) => {
    // Gets game with name 'lobbyName' and its current board or if none found creates a new game with that name
    const { game, board } = await getGameData(lobbyName)
    const gameId = game._id
    // Stores gameId in session storage
    sessionStorage.setItem('gameId', gameId)
    sessionStorage.setItem('lobbyName', lobbyName)

    $('.idHeader span').text(`${lobbyName}`)

    // Sends socket call to server for new player, returns them to home page if name was already taken
    // Should refactor code to prevent entry altogether eventually
    // Would require html changes to start
    socket.emit('join', { playerName: username, gameId }, ({ error, player }) => {
        if (error) {
            alert(error)
            location.href = '/'
            return
        } else {
            // Writes username and playerId into session storage if playname was accepted
            sessionStorage.setItem('username', player.username)
            sessionStorage.setItem('playerId', player._id)
        }
    })

    displaysSetup(board._id)

    if (lobbyName === 'TEST') {
        $('#start-btn').prop('disabled', false)
    }
}

// Displays current board, starting team, and adjusts score counter
const displaysSetup = async (boardId) => {
    // Current board Id written into session storage
    sessionStorage.setItem('boardId', boardId)

    // Gets board and displays it to user
    await generateBoard(boardId)

    // Add 1 to cards remaining for starting team
    const startTeam = sessionStorage.getItem('startTeam')
    const $counter = document.querySelector(`#${startTeam}-team-counter`)
    $counter.innerText = parseInt($counter.innerText) + 1
}


// Chat App functions
const addNewMessage = (html) => {
    $messages.insertAdjacentHTML('beforeend', html)
    $('#messages').animate({scrollTop: $('.message').last().offset().top}, 200)
}

socket.on('message', ({ playerName, text, team, type = ''}) => {
    const html = Mustache.render(messageTemplate, { playerName, text, team, type})
    addNewMessage(html)
})

socket.on('roleMessage', ({ playerName, playerTeam, role }) => {
    const html = Mustache.render(roleMessageTemplate, { playerName, playerTeam, role })
    addNewMessage(html)
})

socket.on('clueMessage', ({ playerName, playerTeam, clue }) => {
    const html = Mustache.render(clueMessageTemplate, { playerName, playerTeam, clue })
    addNewMessage(html)
})

socket.on('guessMessage', ({ playerName, playerTeam, cardWord, cardTeam }) => {
    const html = Mustache.render(guessMessageTemplate, { playerName, playerTeam, cardWord, cardTeam })
    addNewMessage(html)
})

// Role Assignment

// Handles join team buttons, Gives user a role and a team, Adjusts display accordingly
const joinTeamEvent = async (e) => {
        const role = e.target.getAttribute('role')
        const team = e.target.getAttribute('team')
        const startTeam = sessionStorage.getItem('startTeam')

        $('.team-join-btn').prop('disabled', true)

        // changes player info in database
        const changes = { 'role': role, 'team': team }
        const playerId = sessionStorage.getItem('playerId')
        const response = await fetch(`/players/${playerId}`, { method: 'PATCH', headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) })
        const player = await response.json()

        // Changes display to give card overlay and give clue form if they become a spymaster
        if (player.role === 'spymaster') {
            const boardId = sessionStorage.getItem('boardId')
            addBoardOverlay(boardId, player.role)
            $clueForm.style.display = 'block'
            if (player.team === startTeam) {
                socket.emit('updateActivePlayer', { playerName: player.username, team: player.team, role: player.role, gameId: player.gameId })
            }

        }

        socket.emit('new-role', { role, team, playerId })
}

$('.team-join-btn').on('click', function (e) {joinTeamEvent(e)})


// Recieves claimed roles and adjusts user's display to show username in place of button
socket.on('new-player-role', ({ role, team, username, gameFull }) => {
    const wrapper = document.querySelector(`#${role}-${team}-wrapper`)
    wrapper.innerHTML = `<p class='role-username card-word'> ${username} </p>`
    if (gameFull) {
        $('#start-btn').prop('disabled', false)
    }
})

socket.on('reset-player-role', async ({ role, team }) => {
    if (team !== 'civilian') {
        $(`#${role}-${team}-wrapper`).html(`<button team='${team}' role='${role}' class="team-join-btn">Join</button>`)
    }
    const lobbyName = sessionStorage.getItem('lobbyName')
    if ( lobbyName !== 'TEST' ) {
        $('#start-btn').prop('disabled', true)
    }

    const playerId = sessionStorage.getItem('playerId')
    const playerRaw = await fetch(`/players/${playerId}`)
    const player = await playerRaw.json()

    if(player.team !== '' ){
        $(`#${role}-${team}-wrapper`).prop('disabled', true)
    }

})

socket.on('update-active-state', ({gameState}) => {
    $(".status-box").css("display", "none")

    if ( gameState === 'pregame' ) {
        $('#start-menu').css("display", "grid")
    } else if ( gameState === 'ongoing' ) {
        $('#game-status-box').css("display", "grid")
    } else if ( gameState === 'victory-screen' ) {
        $('#victory-menu').css("display", "grid")
    }
})

// Game Events

// Event cards are given
const cardEvent = async (word) => {
    const boardId = sessionStorage.getItem('boardId')

    const playerId = sessionStorage.getItem('playerId')
    const playerRaw = await fetch(`/players/${playerId}`)
    const player = await playerRaw.json()

    // Reveals card team to all players and checks if card belongs to user's team 
    socket.emit('handleGuess', { word, guessNumber: currentGuesses, boardId, player }, ({yourTurn, team}) => {
        // Ends turn if out of guesses or bad guess
        if (yourTurn === false) {
            currentGuesses = -1
            socket.emit('cluePhase', { team })
            $('.end-turn-btn').prop('disabled', true)
        } else {
            correctGuessSound.play()
            currentGuesses -= 1
            guessEnabled = true
        }
    })
}

// Sends clue to other players through chat message, changes game state to guessing phase
$clueForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $clueFormButton.setAttribute('disabled', 'disabled')

    const clue = e.target.elements.clue.value
    const guessNumber = e.target.elements.guessNumber.value
    const playerId = sessionStorage.getItem('playerId')

    socket.emit('sendClue', { clue, guessNumber, playerId }, (error) => {
        $clueForm.reset()

        if (error) {
            return console.log(error)
        }
    })
})


// Allows guessers to make guesses by clicking on cards
socket.on('guessingPhase', async ({ guessNumber, team }) => {
    const playerId = sessionStorage.getItem('playerId')
    const playerRaw = await fetch(`/players/${playerId}`)
    const player = await playerRaw.json()

    endTurnSound.play();

    // Checks if it's this user's turn
    if (player.role === 'guesser' && player.team === team) {
        currentGuesses = guessNumber
        guessEnabled = true
        $('.end-turn-btn').prop('disabled', false)
        socket.emit('updateActivePlayer', { playerName: player.username, team: player.team, role: player.role, gameId: player.gameId })
    }
})

// Unlocks clueform for next spymaster
socket.on('spymasterPhase', async ({ activeTeam }) => {
    const playerId = sessionStorage.getItem('playerId')
    const playerRaw = await fetch(`/players/${playerId}`)
    const player = await playerRaw.json()

    endTurnSound.play();

    if (player.role === 'spymaster' && player.team === activeTeam) {
        $clueFormButton.removeAttribute('disabled')
        socket.emit('updateActivePlayer', { playerName: player.username, team: player.team, role: player.role, gameId: player.gameId })

    }
})

// Changes css on revealed cards
socket.on('card-reveal', ({ cardTeam, word }) => {
    const card = document.querySelector(`#${word.replace(' ', '_')}-card-id`)
    card.classList.add(`${cardTeam}-card`)
    card.setAttribute(`revealed`, 'true')
})




// Updates cards remaining in teambox on card reveal
socket.on('update-score', ({ cardTeam }) => {
    const $counter = document.querySelector(`#${cardTeam}-team-counter`)
    $counter.innerText = parseInt($counter.innerText) - 1
})

socket.on('assassin-game-over', ({ opposingTeam }) => {
    teamVictory(opposingTeam)
})

socket.on('card-victory', ({team}) => {
    teamVictory(team)
})



const teamVictory = (team) => {
    // Grab player team and play win if player.team === team or lose if !=
    victorySound.play()

    guessEnabled = false

    const boardId = sessionStorage.getItem('boardId')
    addBoardOverlay(boardId)
   
    repositionVictoryMessage()

    const msg = `The ${team} team wins!`

    $('#victory-display')
        .text(msg)
        .css("display", "block")

    $(".status-box").css("display", "none")
    $('#victory-menu').css("display", "grid")
}

const repositionVictoryMessage = () => {
    const gameLogWidth = $('.chat__main').width()
    const gameBoardWidth = window.innerWidth - gameLogWidth
    const gameBoardHeight = $('#board-container').height()

    $('#victory-display')
        .css('left', gameBoardWidth/2 + gameLogWidth)
        .css('top', gameBoardHeight/2)
}

$(window).resize(() => {
    if ($('#victory-display').css('display') !== 'none') {
        repositionVictoryMessage()
    }
})

$('.leave-game-btn').on('click', () => {
    const playerId = sessionStorage.getItem('playerId')
    socket.emit('leave-game', { playerId })
    location.href = '/'
})


// Changes text in game status box
socket.on('updateGameStatusClue', ({guessNumber, clue=''}) => {
    $(`#current-guessNumber`).text(guessNumber)
    if (clue !== ''){
        $(`#current-clue`).text(clue)
    }
})

socket.on('updateGameStatusPlayer', ({playerName, team, role}) => {
        let message = ''
        if (role === 'spymaster'){
            message = `It's ${playerName}'s turn to send a clue.`
        } 
        else {
            message = `It's ${playerName}'s turn to guess.`
        }
        $(`#current-playerName span`).text(message)
        $(`#current-playerName`).css('background-color', `var(--${team}-team-color`)
})

socket.on('revealGameStatus', () => {
    $("#game-status-box").css("display", "grid")
    $("#start-menu").css("display", "none")
})

$('#start-btn').on('click', () => {
    const gameId = sessionStorage.getItem('gameId')
    const startTeam = sessionStorage.getItem('startTeam')
    socket.emit('startGame', {gameId, startTeam})
})

$('#new-game-btn').on('click', () => {
    const gameId = sessionStorage.getItem('gameId')
    // Clears player roles and deletes old board
    socket.emit('clear-board', {gameId})
    newBoard(gameId)
    socket.emit('send-restart', {gameId})
})

$('.end-turn-btn').on('click', async() => {
    const playerId = sessionStorage.getItem('playerId')
    const playerRaw = await fetch(`/players/${playerId}`)
    const player = await playerRaw.json()

    currentGuesses = -1
    guessEnabled = false
    activeTeam = player.team === 'red' ? 'blue' : 'red'

    socket.emit('sendMessage',{ playerName: player.username, text: ` ended their turn.`, team: player.team, gameId: player.gameId})
    socket.emit('updateClue', { gameId: player.gameId })
    socket.emit('end-turn', { activeTeam, gameId: player.gameId })
    $('.end-turn-btn').prop('disabled', true)
})

socket.on('new-round', async ({gameId}) => {
    $('#victory-display').css('display', 'none')
    //Removing player roles and teams
    const changes = { 'role': 'guesser', 'team': 'civilian' }
    const playerId = sessionStorage.getItem('playerId')
    await fetch(`/players/${playerId}`, { method: 'PATCH', headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) })

    $clueForm.style.display = 'none'
    $('.counter').text('8')

    $('.team-join-btn').on('click', function (e) {joinTeamEvent(e)})

    $('#start-btn').prop('disabled', true)

    const boardRaw = await fetch(`/boards/game/${gameId}`)
    const board = await boardRaw.json()
    displaysSetup(board._id)

    $messages.innerHTML = ''

    $('.status-box').css("display", "none")
    $("#start-menu").css("display", "grid")
})


joinGame(username, lobbyName)