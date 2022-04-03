const { query } = require('express');
const express = require('express');
const router = express.Router({mergeParams: true});
const { v4: uuidv4 } = require('uuid');
const { Games: Games } = require('../modules/game');
const { Users: Users } = require('../modules/user');

router.get('/', (req, res) => {
    search = req.query.search;
    try{
        if(search){
            res.send(Games.getGamesBySearch(search))
        }else{
            res.send(Games.games)
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e);
    }
});

router.get('/:id', (req, res) => {
    try {
        if (Games.getGame(req.params.id)) {
            res.send(Games.getGame(req.params.id));
        } else {
            res.status(404).send('Game not found');
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.post('/', (req, res) => {
    id = uuidv4()
    admin = req.body.admin;
    game_name = req.body.name;
    try {
        if (!Users.getUser(admin) || !Users.getUser(admin).loggedIn) {
            res.status(401).send('User is not logged in'); 
        } else {
            Games.addGame(id, Users.getUser(admin), game_name)
            res.send(Games.getGame(id));
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.post('/join', (req, res) => {
    id = req.body.id;
    login = req.body.login;
    try {
        if (Games.getGame(id) && Users.getUser(login)) {
            Users.getUser(login).joinGame(id);
            res.send(Games.getGame(id));
        } else {
            res.status(404).send('Game or user not found');
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.post('/leave', (req, res) => {
    login = req.body.login;
    try {
        if (Users.getUser(login)) {
            id = Users.getUser(login).inGame;
            Users.getUser(login).leaveGame();
            if (Games.getGame(id)) {
                res.send(Games.getGame(id));
            } else {
                res.send({players: []});
            }

        } else {
            res.status(401).send('User not found');
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.put('/:id', (req, res) => {
    id = req.params.id
    game_name = req.body.name;
    game_status = req.body.status;
    game_max_players = req.body.maxPlayers;
    game_admin = req.body.admin;
    try {
        if (!Games.getGame(id)) {
            res.status(404).send('Game not found');
        }
        if (game_name) {
            Games.getGame(id).setName(game_name)
        }
        if (game_status) {
            Games.getGame(id).setStatus(game_status)
        }
        if (game_max_players) {
            Games.getGame(id).setMaxPlayers(game_max_players)
        }
        if (game_admin) {
            Games.getGame(id).admin = Users.getUser(game_admin)
        }
        res.send(Games.getGame(id));
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

router.post('/start/:id', (req, res) => {
    id = req.params.id
    try {
        if (!Games.getGame(id)) {
            res.status(404).send('Game not found');
        }
        if (Games.getGame(id).players.length < 2) {
            res.status(400).send('Not enough players');
        }
        Games.getGame(id).startGame();
        res.send(Games.getGame(id));
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

router.post('/play/:id', (req, res) => {
    id = req.params.id
    login = req.body.login;
    card = req.body.card;
    target = req.body.target;
    try {
        if (!Games.getGame(id)) {
            res.status(404).send('Game not found');
        }
        if (!Users.getUser(login) || !Users.getUser(login).loggedIn) {
            res.status(401).send('User not found');
        }
        if (target !== '' && (!Users.getUser(target) || !Users.getUser(target).loggedIn || Users.getUser(target).inGame !== id)) {
            res.status(401).send('Target not found');
        }
        if (Users.getUser(login).inGame !== id) {
            res.status(401).send('User not in game');
        }
        if (!Games.getGame(id).gameStarted) {
            res.status(401).send('Game not started');
        }
        Games.getGame(id).playCard(Users.getUser(login), card, Users.getUser(target));
        res.send({game: Games.getGame(id), win: Games.getGame(id).checkWin(Users.getUser(login))});
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

router.post('/discard/:id', (req, res) => {
    id = req.params.id
    login = req.body.login;
    card = req.body.card;
    try {
        if (!Games.getGame(id)) {
            res.status(404).send('Game not found');
        }
        if (!Users.getUser(login) || !Users.getUser(login).loggedIn) {
            res.status(401).send('User not found');
        }
        if (Users.getUser(login).inGame !== id) {
            res.status(401).send('User not in game');
        }
        if (!Games.getGame(id).gameStarted) {
            res.status(401).send('Game not started');
        }
        Games.getGame(id).discardCard(Users.getUser(login), card);
        res.send(Games.getGame(id));
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

module.exports = router;