const Card = require('./card')

class Games {
    static games = []

    static addGame(id, admin, name) {
        Games.games.push(new Game(id, admin, name))
    }

    static deleteGame(gameId) {
        Games.games = Games.games.filter(game => game.id !== gameId)
    }

    static getGame(gameId) {
        return Games.games.find(game => game.id === gameId)
    }

    static getGameByName(name) {
        return Games.games.find(game => game.name === name)
    }

    static getGamesBySearch(search) {
        return Games.games.filter(game => game.name.toLowerCase().includes(search.toLowerCase()))
    }

}

class Game {
    constructor(id, admin, name){
        this.id = id
        this.admin = admin
        this.name = name
        this.players = [admin]
        this.status = "public"
        this.maxPlayers = 4
        this.gameStarted = false
        this.deck = []
        this.discard = []
        this.playersCards = {}
        this.playersOrgans = {}
        this.turn = 0
        this.admin.inGame = id
    }

    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player)
            player.inGame = this.id
        } else {
            throw "Game is full"
        }
    }

    removePlayer(player) {
        this.players = this.players.filter(p => p.login !== player.login)
        player.inGame = undefined
        if (this.players.length === 0) {
            Games.deleteGame(this.id)
        }
        if(player === this.admin) {
            this.admin = this.players[0]
        }
        if(this.gameStarted && this.players.length === 1) {
            this.endGame()
        }
    }

    setStatus(status) {
        this.status = status
    }

    setMaxPlayers(maxPlayers) {
        if (maxPlayers > 6) {
            throw "Max players is 6"
        } else {
            this.maxPlayers = maxPlayers
        }
    }

    setName(name) {
        this.name = name
    }

    createDeck() {
        const types = ["organ", "wirus", "lek"]
        const colors = ["red", "blue", "yellow", "green"]
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                if (types[i] === "organ") {
                    for (let k = 0; k < 5; k++) {
                        this.deck.push(new Card(types[i], colors[j]))
                    }
                } else {
                    for (let k = 0; k < 4; k++) {
                        this.deck.push(new Card(types[i], colors[j]))
                    }
                }
            }
        }
    }

    shuffleDeck() {
        let shuffled = []
        while (shuffled.length < this.deck.length) {
            let random = Math.floor(Math.random() * this.deck.length)
            if (!shuffled.includes(this.deck[random])) {
                shuffled.push(this.deck[random])
            }
        }
        this.deck = shuffled
    }

    shuffleDiscard() {
        let shuffled = []
        while (shuffled.length < this.discard.length) {
            let random = Math.floor(Math.random() * this.discard.length)
            if (!shuffled.includes(this.discard[random])) {
                shuffled.push(this.discard[random])
            }
        }
        this.deck = shuffled
        this.discard = []
    }

    drawCard() {
        if (this.deck.length === 0) {
            this.shuffleDiscard()
        }
        return this.deck.pop()
    }

    discardCard(player, card) {
        this.discard.push(new Card(card.cardType, card.cardColor))
        var index = this.playersCards[player.login].indexOf(this.playersCards[player.login].find(c => c.cardColor === card.cardColor && c.cardType === card.cardType))
        if (index > -1) {
            this.playersCards[player.login].splice(index, 1)
        } else {
            throw "You don't have this card"
        }
        this.playersCards[player.login].push(this.drawCard())
        this.turn = (this.turn + 1) % this.players.length
    }

    checkOrgan(player, color) {
        if (this.playersOrgans[player.login] === undefined) {
            this.playersOrgans[player.login] = []
        }
        for (let i = 0; i < this.playersOrgans[player.login].length; i++) {
            if (this.playersOrgans[player.login][i].cardColor === color) {
                return true
            }
        }
        return false
    }

    playCard(player, card, target = null) {
        if (this.playersCards[player.login].find(c => c.cardColor === card.cardColor && c.cardType === card.cardType)) {
            if (card.cardType === "organ") {
                if (this.checkOrgan(player, card.cardColor)) {
                    throw "You already have this organ"
                } else {
                    this.playersOrgans[player.login].push(new Card(card.cardType, card.cardColor))
                }
            } else if (card.cardType === "wirus") {
                if (target === null) {
                    throw "Target is required"
                } else if (target.login === player.login) {
                    throw "You cannot target yourself"
                } else if (!this.checkOrgan(target, card.cardColor)) {
                    throw "Target does not have an organ of this color"
                } else {
                    var organ = this.playersOrgans[target.login].find(organ => organ.cardColor === card.cardColor)
                    if (organ.Infect() === "discard") {
                        this.discard.push(organ)
                        organ.infected = false
                        this.playersOrgans[target.login] = this.playersOrgans[target.login].filter(organ => organ.cardColor !== card.cardColor)
                    }
                }
            } else if (card.cardType === "lek") {
                if (!this.checkOrgan(player, card.cardColor)) {
                    throw "You don't have an organ of this color"
                } else {
                    this.playersOrgans[player.login].find(organ => organ.cardColor === card.cardColor).Treat()
                }
            }
            this.discardCard(player, card)
        } else {
            throw "You don't have this card"
        }
    }

    checkWin(player) {
        var organs = 0
        for (let i = 0; i < this.playersOrgans[player.login].length; i++) {
            if (!this.playersOrgans[player.login][i].infected) {
                organs++
            }
        }
        if (organs === 4) {
            this.endGame()
            return player.login
        } else {
            return false
        }
    }

    endGame() {
        this.gameStarted = false
        this.deck = []
        this.discard = []
        this.playersCards = {}
        this.playersOrgans = {}
    }


    startGame() {
        for (let player of this.players) {
            this.playersCards[player.login] = []
            this.playersOrgans[player.login] = []
        }
        this.gameStarted = true
        this.turn = 0
        this.createDeck()
        this.shuffleDeck()
        for (let i = 0; i < 3; i++) {
            for (let player of this.players) {
                this.playersCards[player.login].push(this.drawCard())
            }
        }

    }

}


module.exports = { Game, Games }