const socket = io()

// Elements
const $boardContainer = document.querySelector("#board-container")
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML

// Options
const {username, lobbyName} = Qs.parse(location.search, { ignoreQueryPrefix:true})

const generateBoard = async (boardId) => {
    clearBoard()
    const response = await fetch(`/boards/${boardId}`)
    const data = await response.json()
    
    data.wordlist.forEach((word, i) => {
        const node = document.createElement('div')
        node.className = "card"
        node.classList.add(`${data.overlay[i]}-card`)   //if spymaster
        node.innerText = word
        $boardContainer.appendChild(node)
    });
}

const clearBoard = () => { $boardContainer.innerHTML = '' }

const newBoard = async (gameId) => {
    const response = await fetch(`/boards/${gameId}`, {method: 'POST'})
    const data = await response.json()
    generateBoard(data._id)
}

const newGame = async (lobbyName) => {
    const response = await fetch(`/games/${lobbyName}`, {method: 'POST'})
    const data = await response.json()
    generateBoard(data.board._id)
}

const isNewGame = async (username, lobbyName) => {
    const response = await fetch(`/games/lobby/${lobbyName}`)
    const data = await response.json()
    console.log(data)
    if (data.msg === 'no game found'){
        // makes new game with player
        return newGame(lobbyName)
    }
    // finds and loads game board
    const boardRes = await fetch(`/boards/game/${data._id}`)
    const board = await boardRes.json()
    generateBoard(board._id)

    // makes new player in game
    const player = await fetch(`/players`, {method: 'POST', body: JSON.stringify({'username': `${username}`})})

}

socket.on('newPlayer', (player) => {
    console.log('new player created')
})

/*
socket.emit('join', {username, lobbyName}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
*/

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
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})




// SAM HELP:     should join function exist here or in index.js   and what to name isNewGame   whether/how to break up isNewGame?
// I don't think current organization allows for rejection of duplicate usernames   or pass protecting games       
// Also isNewGame combines join and create button functions


// socket.on('join', (username, lobbyName) => {
//     isNewGame(username, lobbyName)
// })

// socket.emit('join', {username, room}, (error) => {
//     if (error) {
//         alert(error)
//         location.href = '/'
//     }
// })

isNewGame(lobbyName)