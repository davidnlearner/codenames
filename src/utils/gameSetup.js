const fs = require('fs')
const testListPath = './assets/wordlist.txt'
const fullListPath = './assets/offical_wordlist.txt'

const wordlistBuffer = fs.readFileSync(testListPath, (err, data) => {
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

const newOverlay = () => {
  const overlay = []
  return overlay
}

module.exports = {
  newWords,
  newOverlay
}
