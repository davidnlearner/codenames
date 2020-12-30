const players = []

const addPlayer = ({ id, username, lobbyName }) => {
    // Clean the data
    username = username.trim().toLowerCase()
    lobbyName = lobbyName.trim().toLowerCase()

    // Validate the data
    if (!username || !lobbyName) {
        return {
            error: 'Username and lobby name are required'
        }
    }

    // Check for existing user

    const existingPlayer = players.find((player) => {
        return player.lobbyName === lobbyName && player.username === username
    })

    if(existingPlayer) {
        return {
            error: 'Username is in use!'
        }
    }

    // Store user
    const player = { id, username, lobbyName }
    users.push(user)
    return { user }

}

const removePlayer = (id) => {
    const index = players.findIndex((player) => player.id === id)

    if (index != -1) {
       return players.splice(index, 1)[0]
    }
}

const getPlayer = (id) => {
    return players.find((player) => player.id === id)
}

const getPlayersInGame = (lobbyName) => {
    lobbyName = lobbyName.trim().toLowerCase()
    return users.filter((player) => player.lobbyName === lobbyName)
}

module.exports = {
    addPlayer,
    removePlayer,
    getPlayer,
    getPlayersInGame
}