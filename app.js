/**
 * Copyright (c) 2019, Massachusetts Institute of Technology (MIT)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Main application. Runs the Express web server, sets up the main Socket.io communications, event
 * handling, and connection to Mongo Database
 */
let express = require('express');
const util = require('util');
const uuidv4 = require('uuid/v4');
let app = express();
app.use(express.static('public'));
app.use(express.static('dashboard'));
let http = require('http').Server(app);
let io = require('socket.io')(http);

// Set port to the port specified by the environment variable, or if not specified, use port 3000
let port = process.env.PORT || 3000;

// Mongo utility that connects to the mongo database
let mongoUtil = require('./database/mongo');

// This will be the reference to the mongo database connection when initialized below
let mongo;

let lobbyUsers = {};
let users = {};
let activeGames = {};

// Set up route to root path "/"
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/default.html');
});

// Set up route to dashboard path
app.get('/dashboard/', function (req, res) {
    res.sendFile(__dirname + '/dashboard/dashboard.html');
});

// Socket.io connection event handler
io.on('connection', function (socket) {
    
    console.log('new connection ' + socket);

    //////////////////////////
    // Socket event handling
    //////////////////////////

    socket.on('error', function(err) {
        console.error("!!! Caught error: ", err);
        // TODO: Should handle errors appropriately here
        persistToMongoDB('errors', { error: err });
    });

    // Client OR Server is disconnecting, but can still be leaving rooms
    socket.on('disconnecting', function(reason) {
        // TODO: can use this if you want to know the socket is about to be fully disconnected
    });

    // Has left rooms, and really disconnected
    socket.on('disconnect', function (reason) {

        let userId = socket.userId;

        console.log(util.format("Got disconnect on user %s: %s", userId, reason));
        persistToMongoDB('disconnect', { userID: userId, reason: reason });
        let gameId;
        if(socket.gameId) {
            gameId = socket.gameId;
        } else {
            if(users[userId] && users[userId].games) {
                Object.keys(users[userId].games).forEach( (game) => {
                    gameId = game;
                    return;
                }, this);
            }
        }

        if(gameId && activeGames[gameId]) {
            console.log(util.format("\tThey were in active game %s", gameId));

            let otherUser = (activeGames[gameId].users.black === userId) ?
                activeGames[gameId].users.white : activeGames[gameId].users.black;

            socket.broadcast.emit('opponentdropped', {
                gameId: gameId,
                otherUser: userId,
                userId: otherUser,
                reason: reason
            });

            handleGameCleanupWithDroppedPlayer(gameId, userId, otherUser);
        }

        // If this user was in the lobby, delete their lobby socket
        if(lobbyUsers[socket.userId]) {
            delete lobbyUsers[socket.userId];
        }

        delete users[socket.userId];

        // Broadcast to all other users that this user (and game if they were in one) has dropped/logged out
        socket.broadcast.emit('logout', {
            userId: socket.userId,
            gameId: gameId
        });

    });


    ///////////////////
    // Game messages
    ///////////////////

    // login event is fired when user logs in on the login screen
    socket.on('login', function (userId) {
        doLogin(socket, userId);
        persistToMongoDB('login', { userID: userId });
    });

    // When user leaves game and joins the lobby
    socket.on('lobby', function(userId) {
        doLobbyRejoin(socket, userId);
    });

    // TODO: rename to something more appropriate, this is initiated by the inviter receiving an invite accepted
    //  response from the invitee... so it's really starting a game off, and no longer an "invite"
    socket.on('invite', function (opponentId) {
        console.log('Initiating game: ' + socket.userId + ' --> ' + opponentId);
        persistToMongoDB('initiatinggame', { inviter: socket.userID, invitee: opponentId });

        socket.broadcast.emit('leavelobby', socket.userId);
        socket.broadcast.emit('leavelobby', opponentId);

        let game = {
            id: generateGameId(),
            board: null,
            users: { white: socket.userId, black: opponentId }
        };

        socket.gameId = game.id;
        activeGames[game.id] = game;

        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;

        console.log('starting game: ' + game.id);
        persistToMongoDB('startgame', { gameid: game.id });

        try {
            lobbyUsers[game.users.white].emit('joingame', { game: game, color: 'white' });
            lobbyUsers[game.users.black].emit('joingame', { game: game, color: 'black' });
        } catch(e) {
            // TODO: catching as to not kill the server, but will leave gamestate for these players
            //  messed up. Needs handled properly.
            console.log("WARNING: exception while sending joingame event to users, invalid game state");
            return;
        }

        delete lobbyUsers[game.users.white];
        delete lobbyUsers[game.users.black];

        // TODO: with new mode where they place pieces first, can't send this yet, since it's the default
        //  start state... so either have to pass an empty board, and then update it, or wait and don't
        //  emit the gameadd until the game actually starts, in which case we'd need our hands on the game
        //  state... could have a user emit a new event with the game id and state to trigger a gameadd
        //  for the Dashboard...
        socket.broadcast.emit('gameadd', { gameId: game.id, gameState: game });
    });

    socket.on('sendinvite', function(invitee) {
       lobbyUsers[invitee].emit('invitereceived', socket.userId);
    });

    socket.on('inviteaccepted', function(inviter) {
       // TODO: want to basically trigger on('invite' above, which we could do if we extract the code from
       //   the event handler for calling directly... or we can just send this on to the sender, and make
       //   them emit invite as happened before
       lobbyUsers[inviter].emit('inviteaccepted', socket.userId);
    });

    socket.on('invitedenied', function(inviter) {
        lobbyUsers[inviter].emit('invitedenied', socket.userId);
    });

    socket.on('inviterescinded', function(inviter) {
        lobbyUsers[inviter].emit('inviterescinded', socket.userId);
    });

    socket.on('readyup', function (msg) {
        socket.broadcast.emit('readyup', msg);
        console.log("Player is Ready: ", msg);
        persistToMongoDB('readyup', msg);
    });

    // Fired by an opponent that clicked Resign
    socket.on('resign', function (msg) {
        console.log(util.format("%s resigned...", msg.userId), msg);
        persistToMongoDB('resign', msg);
        deleteActiveAndUserGamesSafely(msg.gameId);
        socket.broadcast.emit('resign', msg);
    });

    socket.on('tolobby', function (msg) {
        deleteActiveAndUserGamesSafely(msg.gameId);
    });

    // A game ending condition was met
    socket.on('gameover', function (msg) {
        socket.broadcast.emit('gameover', msg);
        activeGames[msg.gameId].board = msg.board;
        console.log("Game Over: ", msg);

        const users = activeGames[msg.gameId].users;
        msg.users = users;
        msg.ended = new Date().getTime();
        persistToMongoDB('gameover', msg);
    });

    // A user submitted a configuration change
    socket.on('configupdate', function (msg) {
        console.log("configupdate: ", msg);
        persistToMongoDB('configupdate', msg);
        socket.broadcast.emit('configupdate', msg);
    });

    // A user submitted an admin configuration change
    socket.on('adminupdate', function (msg) {
        console.log("adminupdate: ", msg);
        persistToMongoDB('adminupdate', msg);
        socket.broadcast.emit('adminupdate', msg);
    });

    // A user moves a piece
    socket.on('move', function (msg) {
        socket.broadcast.emit('move', msg);
        activeGames[msg.gameId].board = msg.board;
        console.log("Move Complete: ", msg);
        persistToMongoDB('moves', msg);
    });

    socket.on('comparescores', function (msg) {
        socket.broadcast.emit('comparescores', msg);
        console.log("comparescores: ", msg);
    });

    socket.on('sendscores', function (msg) {
        socket.broadcast.emit('sendscores', msg);
        console.log("sendscores: ", msg);
    });

    socket.on('kingcapture', function (msg) {
        socket.broadcast.emit('kingcapture', msg);
        console.log("kingcapture: ", msg);
    });

    /**
     * Deletes both the activeGames and user games entry for the specified gameId, while
     * guarding against the game or users not existing.
     *
     * @param {string} gameId - the UUID of the game entries to delete
     */
    function deleteActiveAndUserGamesSafely(gameId) {

        if(!gameId) {
            return;
        }

        if(!activeGames[gameId]) {
            return;
        }

        try {
            delete users[activeGames[gameId].users.white].games[gameId];
        } catch (e) {
            console.warn("Game/user no longer exists to delete");
        }


        try {
            delete users[activeGames[gameId].users.black].games[gameId];
        } catch (e) {
            console.warn("Game/user no longer exists to delete");
        }


        try {
            delete activeGames[gameId];
        } catch (e) {
            console.warn("Game/user no longer exists to delete");
        }

    }

    /**
     * Generates a version 4 UUID for game IDs
     *
     * @returns a uuid
     */
    function generateGameId() {
        return uuidv4();
    }

    /**
     * Performs login actions for the socket and userId
     * - username validation
     *  - can't be in use,
     *  - can't be empty
     * - Adds user to users collection
     * - calls emitLoginAndJoinLobby function to emit events
     *
     * @param socket - the user's socket connection
     * @param userId - the username the user signed in with
     */
    function doLogin(socket, userId) {
        socket.userId = userId;

        if(users[userId.trim()]) {
            // Username taken
            socket.emit('loginfailure', userId);
            return;
        }

        console.log('creating new user');
        users[userId] = { userId: socket.userId, games: {} };

        emitLoginAndJoinLobby(socket, userId);
    }

    /**
     * Utility function for emitting login and join lobby events
     *
     * @param socket - the user's new socket connection
     * @param userId - the username of the user
     *
     */
    function emitLoginAndJoinLobby(socket, userId) {

        socket.emit('login', {
            users: Object.keys(lobbyUsers),
            games: Object.keys(users[userId].games)
        });
        lobbyUsers[userId] = socket;

        socket.broadcast.emit('joinlobby', socket.userId);
    }

    /**
     * Performs actions related to user rejoining the lobby (coming from a game)
     *
     * TODO: recheck usage, it's just doing the same login/joinlobby as when logging in, when
     *  it should only be rejoining lobby?
     *
     * @param socket
     * @param userId
     */
    function doLobbyRejoin(socket, userId) {

        socket.userId = userId;

        if(!users[userId]) {
            return;
        }

        console.log(util.format("User %s rejoining lobby", userId));
        emitLoginAndJoinLobby(socket, userId);
    }


    /**
     * Handle cleaning up a game that ended prematurely, due to a disconnect or
     * other issue
     *
     * @param {number} gameId - ID of the game to clear
     * @param {string} userId - ID of the user who dropped
     * @param {string} otherUser - the other user that was in the game
     *
     */
    function handleGameCleanupWithDroppedPlayer(gameId, userId, otherUser) {

        console.log("Broadcasting game resign on behalf of a dropped player for GameID: " + gameId);
        socket.broadcast.emit('resign', {gameId: gameId});

        // TODO: store game results as interrupted?

        try {
            console.log(util.format("Deleting a dropped/disconnected game from active games: %s", gameId));
            // TODO: these three calls have a utility method to use ... deleteUserGamesSafeley
            delete activeGames[gameId];
            delete users[userId].games[gameId];
            delete users[otherUser].games[gameId];

            socket.broadcast.emit('updategames', {userId: otherUser, games: Object.keys(users[otherUser].games)});

            console.log(util.format("\tGame deleted from active games: %s", gameId));
        } catch (e) {
            console.error("Error deleting active game: " + e.message, e);
        }

    }

    /**
     * Utility function for persisting json into the specified collection
     *
     * @param {string} col - the named collection to persist data to
     * @param {Object} msg - the data to persist
     */
    function persistToMongoDB(col, msg) {
        mongo.db().collection(col).insertOne(msg, (err) => {
            if(err) {
                console.error(util.format("Error inserting into %s", col), err);
            }
        });
    }

    ///////////////////
    // Chat messages //
    ///////////////////

    socket.on('sendchat', function (msg) {
        console.log("Got chat: ", msg);
        persistToMongoDB('chat', msg);
        socket.broadcast.emit('broadcastchat', msg);
    });

    socket.on('broadcastchat', function (msg) {
        console.log("Received broadcast in appjs: ", msg);
    });

    // TODO: no longer supporting backing out
    /*
    socket.on('backedout', function (msg) {
        console.log("Received backedout in appjs from: ", msg);
        socket.broadcast.emit('broadcastbackedout', msg);
    });*/

    /////////////////////
    // Dashboard messages 
    /////////////////////

    // User navigated to Dashboard
    socket.on('dashboardlogin', function () {
        console.log('dashboard joined');
        socket.emit('dashboardlogin', { games: activeGames });
    });

});

/**
 * Initializes the mongo connection using the mongoUtil, and if successful, starts up the
 * http application server.
 *
 */
mongoUtil.init( function(err) {
    if(err) {
        throw err;
    }

    console.log("Successfully connected to mongo");

    mongo = mongoUtil.getDb();

    // When the mongodb server goes down, the driver emits a 'close' event
    mongo.on('close', () => { console.log('-> mongo lost connection'); });
    // The driver tries to automatically reconnect by default, so when the
    // server starts the driver will reconnect and emit a 'reconnect' event.
    mongo.on('reconnect', () => { console.log('-> mongo reconnected'); });


    http.listen(port, function () {
        console.log('DC Chess Started, Listening on port: ' + port);
    });
});