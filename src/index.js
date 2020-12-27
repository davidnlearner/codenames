const app = require('./app')
const http = require('http')
const port = process.env.PORT || 3000
//const server = http.createServer(app)
//const io = socketio(server)


//const publicDirectoryPath = path.join(__dirname, '../public')

//app.use(express.static(publicDirectoryPath))

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})