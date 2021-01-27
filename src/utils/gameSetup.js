const fs = require('fs')
const testListPath = './assets/wordlist.txt'
const wordListPath = './assets/official_wordlist.txt'

const wordlistBuffer = fs.readFileSync(wordListPath, (err, data) => {
    if (err) callback('We have a problem', err);

    return data;
  })

const rawText = wordlistBuffer.toString()
const wordlist = rawText.split('\n')

const newWords = () => {
  const gameWords = []
  while(gameWords.length < 25){
    const randomNumber = Math.floor(Math.random() * wordlist.length)
    const newWord = wordlist[randomNumber]
    if (!gameWords.find((word) => word === newWord)){
      gameWords.push(newWord)
    }
  }
  return gameWords
}

const getStartTeam = () => {
  const team = Math.round(Math.random())
  if(team === 1) {
    return 'red'
  } else {
    return 'blue'
  }
}

const newOverlay = (startTeam) => {
  const overlay = []
  const teams = ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'assassin']
  //for (r = 0; r < 8; r++) {}
  const civilians = 25 - (teams.length + 1)
  for (i = 0; i < civilians; i++){
    teams.push('civilain')
  }

  if (startTeam === 'red'){
    teams.push('red')
  } else {
    teams.push('blue')
  }

  while(overlay.length < 25){
    let randomNumber = Math.floor(Math.random() * teams.length)
    overlay.push(teams[randomNumber])
    let team = teams.pop()
    if (teams.length > randomNumber){
      teams[randomNumber] = team
    }

  }
  return overlay
}

module.exports = {
  newWords,
  newOverlay,
  getStartTeam
}
