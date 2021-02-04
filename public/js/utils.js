const lettersOnly = (e) => {
    const key = e.keyCode
    // In order CAPITAL LETTERS, backspace, lower case letters, return key
    return ((key >= 65 && key <= 90) || key == 8 || (key >= 97 && key <= 122) || key == 13)
}

const lettersOnlyCaps = (e) => {
    const key = e.keyCode
    if ((key >= 97 && key <= 122)){
        return (key - 32)
    }
    return ( key == 8 || (key >= 65 && key <= 90) || key == 13)
}

const numbersOnly = (e) => {
    const key = e.keyCode
    return ((key >= 48 && key <= 57) || key == 8 || key == 13)
}

const dupUserChecker = async function(e) {
    e.preventDefault()  
    
    const username = $('#join-form input')[0].value
    const lobbyName = $('#join-form input')[1].value

    // Looks for game with name 'lobbyName'
    const gameRaw = await fetch(`/games/lobby/${lobbyName}`)
    const game = await gameRaw.json()

    // If there is game 'lobbyName' in database returns a new game, 
    // else gets current game board and returns the game with the board
    if (game.msg === 'no game found') {
        //let them through  (this might work?)
        location.href = `/codenames.html?username=${username}&lobbyName=${lobbyName}`
    }
    else {

        const rawAllPlayers = await fetch(`/players/`, { method: 'GET' })
        const allPlayers = await rawAllPlayers.json()
        const dupPlayers = allPlayers.filter((eachPlayer) => { 
            if(eachPlayer.gameId === game._id && eachPlayer.username === username){
                return eachPlayer
            }
        })
        if (dupPlayers.length > 0) {
            // Unsure how to call error message
            //return callback({ error: 'Username is already taken. Try again.' })
            $('.centered-form__error-message').text('Username is already taken. Try again.')
            //console.log('Username is already taken. Try again.')
        } 
        else {
            location.href = `/codenames.html?username=${username}&lobbyName=${lobbyName}`
        }
        
    }
}