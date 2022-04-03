const express = require('express');
const router = express.Router({mergeParams: true});
const { v4: uuidv4 } = require('uuid');
const { Users: Users } = require('../modules/user');
const bcrypt = require("bcryptjs");

router.get('/users', (req, res) => {
    res.send(Users.users);
});

router.get('/online-users', (req, res) => {
    try {
        res.send(Users.users.filter(user => user.loggedIn));
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.post('/login', (req, res) => {
    login = req.body.login;
    password = req.body.password;
    try {
        if (Users.getUser(login) && Users.getUser(login).checkPassword(password)) {
            Users.getUser(login).logIn();
            res.cookie("login", login, {sameSite: null, path: '/', secure: true}).send(Users.getUser(login));
        } else {
            res.status(401).send('Wrong login or password');
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.post('/logout', (req, res) => {
    login = req.body.login;
    try {
        if (Users.getUser(login)) {
            Users.getUser(login).logOut();
            res.clearCookie("login", {sameSite: null, path: '/', secure: true}).send(Users.getUser(login));
        } else {
            res.status(401).send('User not found');
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.post('/guest', async (req, res) => {
    try {
        if (req.cookies['guest'] && Users.getUser(req.cookies['guest'])) {
            Users.getUser(req.cookies['guest']).logIn();
            res.cookie("login", req.cookies['guest'], {sameSite: null, path: '/', secure: true}).send(Users.getUser(req.cookies['guest']));
        } else if(req.cookies['guest']) {
            Users.addUser(req.cookies['guest'], '');
            Users.getUser(req.cookies['guest']).logIn();
            res.cookie("login", req.cookies['guest'], {sameSite: null, path: '/', secure: true}).send(Users.getUser(req.cookies['guest']));
        } else {
            login = 'guest-' + uuidv4().substring(0, 5);
            Users.addUser(login, '');
            Users.getUser(login).logIn();
            res.cookie('guest', login, {maxAge: 1000 * 60 * 60 * 24 * 365, sameSite: null, path: '/', secure: true})
                .cookie("login", login, {sameSite: null, path: '/', secure: true}).send(Users.getUser(login));
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.post('/register', (req, res) => {
    login = req.body.login;
    password = req.body.password;
    try {
        if (Users.getUser(login)) {
            res.status(401).send('User already exists');
        } else {
            const salt = bcrypt.genSaltSync(10);
            Users.addUser(login, bcrypt.hashSync(password, salt));
            res.send(Users.getUser(login));
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.put('/:login', (req, res) => {
    login = req.params.login;
    new_login = req.body.login;
    password = req.body.password;
    try {
        if (!Users.getUser(login)) {
            res.status(401).send('User not found');
        }
        if (password) {
            const salt = bcrypt.genSaltSync(10);
            Users.getUser(login).password = bcrypt.hashSync(password, salt);
        }
        if (new_login) {
            Users.getUser(login).login = new_login;
        }
        if (!new_login){
            res.send(Users.getUser(login));
        }
        res.send(Users.getUser(new_login));
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.get('/:login', (req, res) => {
    login = req.params.login;
    try {
        if (Users.getUser(login)) {
            res.send(Users.getUser(login));
        } else {
            res.status(401).send('User not found');
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

router.delete('/:login', (req, res) => {
    login = req.params.login;
    try {
        if (Users.getUser(login)) {
            user = Users.getUser(login);
            Users.deleteUser(login);
            res.send(user);
        } else {
            res.status(401).send('User not found');
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});


module.exports = router;