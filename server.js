const express = require('express');
const app = express();
const cors = require('cors');
const game = require('./routes/game');
const login = require('./routes/login');
const { Users: Users } = require('./modules/user');
const { Games: Games } = require('./modules/game');
const users = require('./users_sample');
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.json());
app.use(cors({ credentials: true, origin: /localhost/ }));
app.use('/games', game);
app.use('/', login);

users.forEach(user => {
    const salt = bcrypt.genSaltSync(10);
    Users.addUser(user.login, bcrypt.hashSync(user.password, salt));
});

Users.getUser('admin').logIn();
Users.getUser('root').logIn();
Users.getUser('janedoe').logIn();
Users.getUser('johndoe').logIn();

Games.addGame("1", Users.getUser("root"), "Public game");
Games.addGame("2", Users.getUser("admin"), "Private game");
Games.getGame("2").setStatus("private");
Games.addGame("3", Users.getUser("janedoe"), "Started game");
Users.getUser("johndoe").joinGame("3");
Games.getGame("3").startGame();


app.listen(5000, () => {
    console.log('Server started on port 5000');
});


