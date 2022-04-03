const bcrypt = require("bcryptjs");
const { Games } = require("./game");

class Users {
    
    static users = []

    static addUser(login, password) {
        Users.users.push(new User(login, password))
    }

    static deleteUser(login) {
        Users.users = Users.users.filter(user => user.login !== login)
    }

    static getUser(login) {
        return Users.users.find(user => user.login === login)
    }
}

class User {
    constructor(login, password){
        this.login = login
        this.password = password
        this.loggedIn = false
        this.inGame = undefined
    }

    checkPassword(password) {
        return bcrypt.compareSync(password, this.password)
    }

    logIn() {
        this.loggedIn = true
    }

    logOut() {
        this.loggedIn = false
    }

    joinGame(gameId) {
        if (this.inGame === undefined) {
            Games.getGame(gameId).addPlayer(this)
        } else {
            throw "User is already in game"
        }
    }

    leaveGame() {
        if (this.inGame !== undefined) {
            Games.getGame(this.inGame).removePlayer(this)
        } else {
            throw "User is not in game"
        }
    }

}



module.exports = { Users, User }