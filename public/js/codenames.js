const socket = io()

// Elements
const $boardContainer = document.querySelector("#board-container")

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $messages = document.querySelector('#messages')

const $clueForm = document.querySelector('#clue-form')
const $clueFormInput = $clueForm.querySelectorAll('input')
const $clueFormButton = $clueForm.querySelector('button')

const $joinTeamButton = document.querySelectorAll('.team-join-btn')

const $endGameButton = document.querySelector('#end-game-btn')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML

// Options
const { username, lobbyName } = Qs.parse(location.search, { ignoreQueryPrefix: true })


// Calls current board from database and displays
// Can be made into an import
const generateBoard = async (boardId) => {
    clearBoard()
    const response = await fetch(`/boards/initial/${boardId}`)
    const data = await response.json()

    // Saves startTeam in session storage
    sessionStorage.setItem('startTeam', data.startTeam)
    console.log(data.startTeam)

    // Adds a card for each word to html
    data.wordlist.forEach((word) => {
        const node = document.createElement('div')
        node.className = "card"
        node.innerHTML = `<div class='card-word'><span>${word}</span></div>`
        $boardContainer.appendChild(node)
    });
}


// Adds team colors to cards
// Can be made into an import
// Might need cleanup due to limited usage
const addBoardOverlay = async (boardId, role) => {
    const response = await fetch(`/boards/${boardId}/${role}`)
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


// Creates and displays a new board (for new round)
// Can be made into an import
// Not currently in use
const newBoard = async (gameId) => {
    const response = await fetch(`/boards`, { method: 'POST', body: JSON.stringify({ 'gameId': `${gameId}` }) })
    const data = await response.json()
    generateBoard(data._id)
}

// Creates and returns a new game and board
// Can be made into an import
const newGame = async (lobbyName) => {
    // Creates new game 'lobbyName'
    const gameRaw = await fetch(`/games`, { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({lobbyName})})
    const game = await gameRaw.json()

    // Creates a new board tied to newly created game
    const boardRaw = await fetch(`/boards`, {method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: game._id }) })
    const board = await boardRaw.json()

    return {game, board}
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
    } else {
        const boardRaw = await fetch(`/boards/game/${game._id}`)
        const board = await boardRaw.json()

        return { game, board }
    }
}


// Starting function
const joinGame = async (username, lobbyName) => {
    // Gets game with name 'lobbyName' and its current board or if none found creates a new game with that name
    const {game, board} = await getGameData(lobbyName)
    const gameId = game._id
    // Stores gameId in session storage
    sessionStorage.setItem('gameId', gameId)

    // Sends socket call to server for new player, returns them to home page if name was already taken
    // Should refactor code to prevent entry altogether eventually
    // Would require html changes to start
    socket.emit('join', {playerName: username, gameId}, ({error, player}) => {
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

    // Current board Id written into session storage
    sessionStorage.setItem('boardId', board._id)
    // Gets board and displays it to user
    generateBoard(board._id)


    // Something to send start team message to chat
    // This has issues
    // const startTeam = sessionStorage.getItem('startTeam')
    // const message = 'The ' + startTeam + ' Team goes first.'
    // const playerId = sessionStorage.getItem('playerId')
    // socket.emit('sendMessage', {message, playerId}, () => {
    //     return
    // })


}


// Chat App functions

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const username = message.username + ":"
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        // createdAt: moment(message.createdAt).format('hh:mm a'),
        username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable form
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    const playerId = sessionStorage.getItem('playerId')

    socket.emit('sendMessage', { message, playerId }, (error) => {
        // enable form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

// Role Assignment

// Handles join team buttons, Gives user a role and a team, Adjusts display accordingly
// Possible edit: Disable clueform for both cluegivers and create a start game condition/button
$joinTeamButton.forEach((button) => {
    button.addEventListener('click', async (e) => {
        const role = e.target.getAttribute('role')
        const team = e.target.getAttribute('team')
        const startTeam = sessionStorage.getItem('startTeam')

        $joinTeamButton.forEach((btn) => {
            btn.setAttribute('disabled', 'disabled')
        })

        // changes player info in database
        const changes = { 'role': role, 'team': team }
        const playerId = sessionStorage.getItem('playerId')
        const response = await fetch(`/players/${playerId}`, { method: 'PATCH', headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) })
        const player = await response.json()

        // Changes display to give card overlay and give clue form if they become a cluegiver
        if (player.role === 'cluegiver') {
            const boardId = sessionStorage.getItem('boardId')
            addBoardOverlay(boardId, player.role)
            $clueForm.style.display = 'block'
            // disables clueform if they aren't the starting player
            if ( player.team === startTeam){
                $clueFormButton.removeAttribute('disabled')
            }

        }

        socket.emit('new-role', { role, team, playerId })
    })
})

// Recieves claimed roles and adjusts user's display to show username in place of button
socket.on('new-player-role', ({ role, team, username }) => {
    const wrapper = document.querySelector(`#${role}-${team}-wrapper`)
    wrapper.innerHTML = `<p id='role-username'> ${username} </p>`

})

// Game Events

// Sends clue to other players through chat message, changes game state to guessing phase
$clueForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $clueFormButton.setAttribute('disabled', 'disabled')

    const clue = e.target.elements.clue.value
    const guessNumber = e.target.elements.guessNumber.value
    const playerId = sessionStorage.getItem('playerId')

    socket.emit('sendClue', { clue, guessNumber, playerId }, (error) => {
        $clueFormInput[0].value = ''
        $clueFormInput[1].value = ''

        if (error) {
            return console.log(error)
        }

        console.log('Clue delivered!')
    })
})


// Allows guessers to make guesses by clicking on cards
socket.on('guessingPhase', async ({ clue, guessNumber, team }) => {
    console.log('gussingPhase')
    const playerId = sessionStorage.getItem('playerId')
    //const player = await fetch('/players', { method: 'GET', headers: { "Content-Type": "application/json" }, body: JSON.stringify({_id: playerId}) })
    const playerRaw = await fetch(`/players/${playerId}`)
    const player = await playerRaw.json()

    // Checks if it's this user's turn
    console.log(`role: ${player.role} team: ${player.team}`)

    if (player.role === 'guesser' && player.team === team) {
        console.log('Active guesser found')

        const boardId = sessionStorage('boardId')
        // $cards is all cards that have not been previously guessed
        const $cards = document.querySelectorAll(".card [revealed = 'false']")

        // Adds event listener to unrevealed cards that sends card as guess on click
        $cards.forEach((card) => {
            card.addEventListener('click', () => {
                // Reveals card team to all players and checks if card belongs to user's team 
                socket.emit('handleGuess', { word: card.innerText, guessNumber: (guessNumber - 1), boardId, player, card }, (yourTurn) => {
                    // Ends turn if out of guesses or bad guess
                    if (yourTurn === false) {
                        $cards.forEach((card) => {
                            card.removeEventListener('click')
                        })
                        socket.emit('cluePhase', { team })
                    }
                })
            })
        })
    }
})

// Unlocks clueform for next cluegiver
socket.on('cluegiverPhase', async ({ opposingTeam }) => {
    const playerId = sessionStorage.getItem('playerId')
    const player = await fetch('/players', { method: 'GET', body: JSON.stringify({_id: playerId}) })

    if (player.role === 'cluegiver' && player.team !== opposingTeam) {
        $clueFormButton.removeAttribute('disabled')
    }
})


// Changes css on revealed cards
// NEEDS WORK
socket.on('card-reveal', ({cardTeam, card}) => {
    card.classList.add(`${cardTeam}-card`)
    card.styles.setAttribute(`revealed`, 'true')
    card.styles.setAttribute(`opacity`, '0.4')
    card.removeEventListener('click')

})

socket.on('update-score', ({cardTeam}) => {
    const $counter = document.querySelector(`${cardTeam}-team-counter`)
    $counter.innerHTML = $counter.innerHTML - 1
    if ($counter.innerHTML === 0) {
        socket.emit('victory', {cardTeam})   // <------- Need to create 'victory' in index.js and exit handleGuess if this is true
    }
})


$endGameButton.addEventListener('click', () => {
    const playerId = sessionStorage.getItem('playerId')
    socket.emit('end-game', {playerId})
    location.href = '/'
})


joinGame(username, lobbyName)