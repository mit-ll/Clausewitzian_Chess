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
 * Main client javascript, brings in Chess board, login, lobby, and games pages
 *
 */

(function () {

  WinJS.UI.processAll().then(function () {

    //////////////////////////////
    //////////////////////////////
    // Vars
    //////////////////////////////
    //////////////////////////////

    var socket, serverGame;
    socket = io();
    var game, board, setupBoard;
    var username, playerColor;
    var meReady, themReady;
    var myStartFen, theirStartFEN;
    var actualFEN, visibleFEN;
    var usersOnline = [];
    var myGames = [];
    var isGameOver = false;
    var serverGameState;
    const maxTurnsDefault = 20;
    var maxTurns = 20;
    const maxBudgetDefault = 42;
    var maxBudget = 42;
    var currBudget;
    var setupPieceCount;
    const myVictoryConditionDefault = undefined;
    var myVictoryCondition;
    var dualKingCapture = false;
    var vcKing = false;
    var vcChecks = 0;
    var vcMaterial = 0;
    var vcPieces = 0;
    const showScoresDefault = true;
    var showScores = true;
    var currentFrictionPiece;
    var nextFrictionPiece;
    const showCurrentFPDefault = true;
    var showCurrentFP = true;
    const showNextFPDefault = true;
    var showNextFP = true;
    var sentScores = false;
    const showPiecesCapturedDefault = true;
    var showPiecesCaptured = true;
    const showAdversaryScoresDefault = false;
    var showAdversaryScores = false;
    var piecesCaptured = [];
    const advScoresDefault = { KINGCAPTURE: false, THREECHECK: 0, MATERIAL: 0, PIECES: 0 };
    var advScores = { KINGCAPTURE: false, THREECHECK: 0, MATERIAL: 0, PIECES: 0 };
    var victoryConditions = {
      KINGCAPTURE: "King Capture",
      THREECHECK: "Three Check",
      MATERIAL: "Most Material",
      PIECES: "Most Pieces"
    };
    var chessPieces = {
      p: "Pawn",
      r: "Rook",
      b: "Bishop",
      n: "Knight",
      q: "Queen",
      k: "King"
    };
    const pieceCapabilitiesDefault = {
      // lowercase = black pieces, uppercase = white pieces (consistent with FEN)
      P: { viewRange: 2, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 1 },
      N: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 3 },
      B: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 3 },
      R: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 5 },
      Q: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 9 },
      K: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 2 },
      p: { viewRange: 2, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 1 },
      n: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 3 },
      b: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 3 },
      r: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 5 },
      q: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 9 },
      k: { viewRange: 1, sightStrength: 1, jammingValue: 0, showThreatening: false, showThreatened: false, friction: true, value: 2 }
    };

    var pieceCapabilities = pieceCapabilitiesDefault;

    //////////////////////////////
    //////////////////////////////
    // Socket.io handlers
    //////////////////////////////
    //////////////////////////////

    //////////////////////////////
    // Game Setup Handlers
    //////////////////////////////

    socket.on('login', function (msg) {
      usersOnline = msg.users;
      updateUserList();
      myGames = msg.games;
      updateGamesList();
      $('#loggedInUser').text(username);
    });

    socket.on('joinlobby', function (msg) {
      addUser(msg);
    });

    socket.on('updategames', function(msg) {
      if(msg.userId === username && msg.games) {
        myGames = msg.games;
        updateGamesList();
      }

    });

    socket.on('leavelobby', function (msg) {
      removeUser(msg);
    });

    socket.on('gameadd', function (msg) {
      // TODO: So far just the dashboard uses this to add a game to the dashboard, but
      //  individual users might want to receive it for a future feature game feed or
      //  something
    });

    socket.on('resign', function (msg) {
      if (serverGame && serverGame.id && msg.gameId === serverGame.id) {
        showGameoverPopup(msg.userId, doResignActions);
      } else {
        console.log("!!! Got resign message, but not handling due to failed gameId check?");
      }
    });

    socket.on('joingame', function (msg) {
      console.log("joined as game id: " + msg.game.id);
      playerColor = msg.color;
      $('#page-lobby').hide();
      $('#page-game').show();     
      serverGame = msg.game;
      serverGameState = msg.game;
      setupGame();
      document.getElementById("status-label").innerHTML = "<b>Status: Playing " + playerColor + " pieces!</b>";
      addChatUsers(msg.game.id, msg.game.users);
    });

    socket.on('loginfailure', function(userid) {
        $('#page-lobby').hide();
        $('#userLabel').text("");
        $('#login-error').text("That username is currently in use. Try a different one.");
        $('#page-login').show();
    });

    socket.on('logout', function (msg) {
      removeUser(msg.userId);
    });

    // Received a configuration update
    socket.on('configupdate', function (msg) {
      if (msg.userID === username) {
        return;
      }

      // Only update if you're in this game
      if(serverGame && serverGame.id !== msg.gameId) {
        return;
      }

      pieceCapabilities = msg.config;
      populateConfigPanel();
      if (typeof game !== 'undefined' && game !== null) {
        refreshVisibleBoard();
        updateFrictionPieces();
      }
      updateStatus("Updated Piece Config Values");
      
      
    });

    // Received admin config update
    socket.on('adminupdate', function (msg) {
            
      if (msg.userID === username) {
        return;
      }

      // Only update if you're in this game
      if(serverGame && serverGame.id !== msg.gameId) {
        return;
      }

      // Update vars from message
      maxTurns = msg.maxTurns;
      if (typeof game !== 'undefined' && game !== null) {
        game.set_max_move_number(maxTurns);
      } 
      maxBudget = msg.maxBudget;
      showScores = msg.showScores;
      showCurrentFP = msg.showCurrFP;
      showNextFP = msg.showNextFP;
      showAdversaryScores = msg.showAdversaryScores;
      showPiecesCaptured = msg.showPiecesCaptured;
      // Populate the panel
      populateAdminPanel();
      // Update the screen
      updateStatus("Updated Admin Config Values");
      updatePCompValue(currBudget);
      if (typeof game !== 'undefined' && game !== null) {
        refreshVisibleBoard();
        updateFrictionPieces();
        updateScore();
      }
      
    });

    //////////////////////////////
    // Game Play Handlers
    //////////////////////////////

    socket.on('opponentdropped', function(msg) {

      // Only handle if it's for you
      if(msg.userId !== username) {
        return;
      }

      if(serverGame && msg.gameId && msg.gameId === serverGame.id) {
        console.log("Being informed that " + msg.otherUser + " got dropped, and I was in a game with them: " + msg.gameId);
        let reason = "lost their connection.";
        // TODO: "client namespace disconnect" is given when socket.disconnect() is called, and "transport closed" when
        //  you just close the browser/tab. But these messages could differ later
        if(msg.reason.indexOf("disconnect") > 0) {
          reason = "logged off.";
        }
        showGameoverPopup(msg.otherUser, doGameResignClick, reason);
      }

    });

    socket.on('gameover', function (msg) {
      if (serverGame && msg.gameId === serverGame.id) {
        // TODO: clear chat and chat users here?
        showGameOver();
      }
    });

    socket.on('comparescores', function (msg) {
      // If you get one from the other person and you haven't sent scores yet, send yours; show victories
      if (msg.userID !== username) {
        if (serverGame && msg.gameId === serverGame.id) {
          showVictories(msg.scores);
          if (!sentScores) {
            socket.emit('comparescores', { userID: username, gameId: serverGame.id, pColor: playerColor, scores: { KINGCAPTURE: vcKing, THREECHECK: vcChecks, MATERIAL: vcMaterial, PIECES: vcPieces, Condition: myVictoryCondition } });
            sentScores = true;
          }
        }
      }
    });

    socket.on('sendscores', function (msg) {
      if (serverGame && msg.gameId === serverGame.id) {
        advScores = msg.scores;
        updateScore();
      }
    });

    socket.on('kingcapture', function (msg) {
      if (serverGame && msg.gameId === serverGame.id) {
        checkKingCapture(msg);
      }
    });

    socket.on('move', function (msg) {
      if (serverGame && msg.gameId === serverGame.id) {
        game.move(msg.move);
        refreshVisibleBoard();
        updateTurnIndicator(playerColor);
        $('#passBtn').prop("disabled", false);
        flashTurnIndicator(playerColor, 10);
      }
    });

    socket.on('readyup', function (msg) {
      if (msg.userID === username) {
        return;
      }

      // Only update if you're in this game
      if(!game || serverGame.id !== msg.gameId) {
        return;
      }

      if (!themReady) {
        socket.emit('readyup', { userId: username, gameId: serverGameState.id, startFEN: myStartFen, readyup: meReady });
      }
      
      themReady = msg.readyup;
      theirStartFEN = msg.startFEN;

      if (meReady && themReady) {
        initGame();
      } else {
        updateStatus("Waiting on other player...");
      }
      
    });

    //////////////////////////////
    // Chat Handlers
    //////////////////////////////

    socket.on('broadcastbackedout', function (msg) {
      if (serverGame && serverGame.id && msg.gameId === serverGame.id) {
        doRemoveChatUser(msg.userId);
      }
    });

    socket.on('userrejoined', function (msg) {
      // TODO: should only add incoming user... ?
      addChatUsers(msg.gameId, msg.users);
    });

    socket.on('broadcastchat', function (msg) {
      if (serverGame && serverGame.id && serverGame.id === msg.gameId) {
        updateChat(msg.gameId, msg.userId, msg.message);
      }
    });

    //////////////////////////////
    // Invite Handlers
    //////////////////////////////

    socket.on('invitereceived', function(fromUser) {
        console.log("got invite from ", fromUser);
        showInvitation(fromUser);
    });

    socket.on('inviteaccepted', function(invitee) {
      console.log("got ACCEPTED by ", invitee);
      // Close waiting dialog
      $('#awaitingInviteResponse').dialog("close");
      socket.emit('invite', invitee);
    });

    socket.on('invitedenied', function(invitee) {
      console.log("got DENIED by ", invitee);
      // TODO: handle clearing state of this player waiting for a response
      // TODO: may not want to close w/o giving them some log or visual so they know what happened...?
      $('#awaitingInviteResponse').dialog("close");
    });

    socket.on('inviterescinded', function(invitee) {
      console.log("got RESCINDED by ", invitee);
      // TODO: could be same as invitedenied, unless we want to know the difference between an explicit rejection
      //  and a timeout
      // TODO: may not want to close w/o giving them some log or visual so they know what happened...?
      //$('#awaitingInviteResponse').dialog("close");
      //TODO: need to differentiate between which dialog to close?
      updateAwaitingMessageAndClose();
      updateInviteMessageAndClose();
    });

    //////////////////////////////
    // Connection Handlers
    //////////////////////////////

    socket.on('connect_timeout', function(timeout) {
        console.log("got connect_timeout with timeout: ", timeout);
    });

    socket.on('disconnect', function(reason) {
        console.log("got disconnect: ", reason);
    });

    socket.on('connect_error', function(error) {
        console.log("got connect_error:", error);
        // TODO: server down? pop up alert and redirect.
        // TODO: If server went down, it lost state, so clients all need to connect fresh and log in
        window.alert("Lost connection to the server!");
        window.location = "/";
    });

    socket.on('reconnect_attempt', function(attemptNum) {
        console.log("got reconnect try #", attemptNum);
    });

    socket.on('reconnect_error', function(error) {
        console.log("got reconnect_error: ", error);
    });

    socket.on('reconnect_failed', function(msg) {
        // Reconnection failed within the configured number of attempts
        console.log("got reconnect_failed, no longer attempting to reconnect");
    });

    socket.on('error', function(error) {
        console.error("!!!Got error: ", error);
    });


    //////////////////////////////
    //////////////////////////////
    // Menus
    ////////////////////////////// 
    //////////////////////////////

    $('#login').on('click', function () {
      username = $('#username').val();
      if (username.length > 0) {
        $('#userLabel').text(username);
        $('#login-error').text("");
        socket.emit('login', username);
        $('#page-login').hide();
        $('#page-lobby').show();
      }
    });

    $('#username').keyup(function (e) {
      if (e.keyCode === 13) {
        // TODO: use regex to account for empty spaces, etc
        if ($('#username').val() !== "") {
          $('#login').click();
        }
        return false;
      }
    });

    $('#game-resign').on('click', function () {
      socket.emit('resign', { userId: username, gameId: serverGame.id });
      showGameoverPopup(username, doGameResignClick);
    });

    $('#game-back').on('click', function () {
      socket.emit('tolobby', { userId: username, gameId: serverGame.id });
      doGameResignClick();
    });

    $('#logout').on('click', function() {
      $('#page-game').hide();
      $('#page-lobby').hide();
      $('#page-login').show();
      socket.close();
      window.location = "/";
    });

    $('#resignAndLogout').on('click', function() {
      socket.close();
      window.location = "/";
    });

    $('#config-button').on('click', function () {
      populateConfigPanel(); // TODO: should really only do this if currently hidden
      $('#config-panel').toggle();
    });

    $('#submitConfig').on('click', function (e) {
      e.preventDefault();
      updatePieceCapabilities();
      updateStatus("Updated Piece Config Values");
      if (typeof game !== 'undefined' && game !== null) {
        refreshVisibleBoard();
        updateFrictionPieces();
      }
      $('#config-panel').toggle();
      return false;
    });

    $('#cancelConfig').on('click', function (e) {
      e.preventDefault();
      $('#config-panel').toggle();
      return false;
    });

    $('#setAllViewRange').change(function () {
      let allValue = this.value;
      $("input[type='number'][name='viewRange']").each(function () {
        this.value = allValue;
      });
    });

    $('#setAllSightStrength').change(function () {
      let allValue = this.value;
      $("input[type='number'][name='sightStrength']").each(function () {
        this.value = allValue;
      });
    });

    $('#setAllJammingValue').change(function () {
      let allValue = this.value;
      $("input[type='number'][name='jammingValue']").each(function () {
        this.value = allValue;
      });
    });

    $('#setAllShowThreatening').change(function () {
      let allCheck = this.checked;
      $("input[type='checkbox'][name='threatening']").each(function () {
        this.checked = allCheck;
      });
    });

    $('#setAllShowThreatened').change(function () {
      let allCheck = this.checked;
      $("input[type='checkbox'][name='threatened']").each(function () {
        this.checked = allCheck;
      });
    });

    $('#setAllFriction').change(function () {
      let allCheck = this.checked;
      $("input[type='checkbox'][name='friction']").each(function () {
        this.checked = allCheck;
      });
    });

    $('#setAllValue').change(function () {
      let allValue = this.value;
      $("input[type='number'][name='pieceValue']").each(function () {
        this.value = allValue;
      });
    });

    $('#admin-button').on('click', function () {
      populateAdminPanel(); // TODO: should really only do this if currently hidden
      $('#admin-panel').toggle();
    });

    $('#submitAdmin').on('click', function (e) {
      e.preventDefault();
      updateAdminOptions();
      // Update the screen
      updateStatus("Updated Admin Config Values");
      updatePCompValue(currBudget);
      if (typeof game !== 'undefined' && game !== null) {
        refreshVisibleBoard();
        updateFrictionPieces();
        updateScore();
      }     
      $('#admin-panel').toggle();
      return false;
    });

    $('#cancelAdmin').on('click', function (e) {
      e.preventDefault();
      $('#admin-panel').toggle();
      return false;
    });

    $('#chatInput').keyup(function (e) {
      if (e.keyCode === 13) {
        // TODO: use regex to account for empty spaces, etc
        if ($('#chatInput').val() !== "") {
          socket.emit('sendchat', { gameId: serverGame.id, userId: username, message: $('#chatInput').val() });
          updateChat(serverGame.id, username, $('#chatInput').val());
          $('#chatInput').val('');
        }
        return false;
      }
    });

    $('#testButton').on('click', function(e) {
      e.preventDefault();
      return false;
    });

    $('#startBtn').on('click', function(e) {
      if (isValidSetup()) {
        meReady = true;
        myStartFen = setupBoard.fen();
        // publish ready to other player
        socket.emit('readyup', { userId: username, gameId: serverGameState.id, startFEN: myStartFen, readyup: meReady });
        initGame();
        updateStatus("Waiting for other player");
      }
    });

    $('#passBtn').on('click', function(e) {
      handlePass();
    });
    
    //////////////////////////////
    //////////////////////////////
    // Methods
    ////////////////////////////// 
    //////////////////////////////

    //////////////////////////////
    // Game Setup Methods
    //////////////////////////////

    var addUser = function (userId) {
      if(usersOnline[userId]) {
        // TODO: workaround, but is hiding the cause that lead to the user trying to get added a second time
        console.info("WARNING: attempted to add a user to the lobby that's already in it");
        return;
      }
      usersOnline.push(userId);
      updateUserList();
    };

    var removeUser = function (userId) {
      for (var i = 0; i < usersOnline.length; i++) {
        if (usersOnline[i] === userId) {
          usersOnline.splice(i, 1);
        }
      }
      updateUserList();
    };

    // TODO: since no longer supporting backing out, there's 
    // no need to show a list of games, since the user is 
    // either in a game or not, and when they leave it's gone
    var updateGamesList = function () {
      document.getElementById('gamesList').innerHTML = '';
      myGames.forEach(function (game) {
        $('#gamesList').append($('<button>')
          .text('#' + game)
          .on('click', function () {
            socket.emit('resumegame', game); // TODO: no longer supporting resuming a game, look into removing this
          }));
      });
    };

    var updateUserList = function () {
      document.getElementById('userList').innerHTML = '';
      usersOnline.forEach(function (user) {
        $('#userList').append($('<button>')
          .text(user)
          .on('click', function () {
            socket.emit('sendinvite', user);
            showAwaitingInvitation(user);
          }));
      });
    };

    var updatePieceCapabilities = function (options) {
      var pieceIdx;
      var optionIdx;
      $('#configForm *').filter(':input').each(function (idx, ele) {
        try {
          if (ele.type === "submit" || ele.id.substring(0, 6) === "setAll") {
            // ignoring the buttons and the set all options
          } else {
            // Update config
            pieceIdx = ele.id[0];
            optionIdx = ele.id.substring(1, ele.id.length);
            // Brute force updates, whether or not they changed
            let element = document.getElementById(ele.id);
            let value;
            if (element) {
              if (element.type === "checkbox") {
                value = element.checked;
              } else if (element.type === "number") {
                value = element.valueAsNumber;
              }
              pieceCapabilities[pieceIdx][optionIdx] = value;
            } else {
              console.error("No element found for id: " + ele.id);
            }
          }
        } catch (e) {
          // Expected for buttons, should just filter out buttons
          console.error("Error setting config option", e);
        }
      });

      // publish config to other player
      socket.emit('configupdate', { userId: username, config: pieceCapabilities, gameId: serverGame.id });

    };

    var populateConfigPanel = function () {
      var currentCapabilities = pieceCapabilities;
      var el;
      Object.keys(currentCapabilities).forEach(function (piece) {
        Object.keys(currentCapabilities[piece]).forEach(function (option) {
          el = piece + option;
          let input = document.getElementById(el);
          if (input) {
            if (input.type === "checkbox") {
              input.checked = currentCapabilities[piece][option] === true ? true : false;
            } else if (input.type === "number") {
              input.value = currentCapabilities[piece][option];
            } else {
              window.alert("Unsupported input type in config panel: " + input.type);
            }
          } else {
            // True for things like buttons on form
            //console.error("No input found for id " + el);
          }

        });
      });

    };

    var updateAdminOptions = function (options) {
      // Max turns
      var tempMaxTurns = document.getElementById("maxTurns").valueAsNumber;
      maxTurns = (tempMaxTurns) ? tempMaxTurns : 1; // If not undefined or unset or null (must be truthy)
      if (typeof game !== 'undefined' && game !== null) {
        game.set_max_move_number(maxTurns);
      } 
      // Max Budget
      var tempMaxBudget = document.getElementById("maxBudget").valueAsNumber;
      maxBudget = (tempMaxBudget) ? tempMaxBudget : 1;
      // VC
      var tempVC = document.getElementById("vCondition").value;
      myVictoryCondition = (tempVC) ? victoryConditions[tempVC] : myVictoryCondition; // set to existing if unset etc...
      // Set other booleans, ezpz
      showScores = document.getElementById("showScore").checked;
      showCurrentFP = document.getElementById("showCurrFP").checked;
      showNextFP = document.getElementById("showNextFP").checked;
      showPiecesCaptured = document.getElementById("showCaptured").checked;
      showAdversaryScores = document.getElementById("showAdvScores").checked;

      // publish config to other player
      socket.emit('adminupdate', { userId: username, gameId: serverGame.id, maxTurns: maxTurns,
        maxBudget: maxBudget, showScores: showScores, showCurrFP: showCurrentFP, showNextFP: showNextFP,
        showPiecesCaptured: showPiecesCaptured, showAdversaryScores: showAdversaryScores });
    };

    var populateAdminPanel = function () {
      // Set via hard coding for now, might find a smarter way to do it later
      document.getElementById("maxTurns").value = maxTurns;
      document.getElementById("maxBudget").value = maxBudget;
      $('#vCondition').val(getVictoryConditionByVal(myVictoryCondition));
      document.getElementById("showScore").checked = showScores;
      document.getElementById("showCurrFP").checked = showCurrentFP;
      document.getElementById("showNextFP").checked = showNextFP;
      document.getElementById("showCaptured").checked = showPiecesCaptured;
      document.getElementById("showAdvScores").checked = showAdversaryScores;
    };

    var resetAdminConfig = function() {
        console.log("Resetting admin config options to defaults...");
        maxTurns = maxTurnsDefault;
        maxBudget = maxBudgetDefault;
        showScores = showScoresDefault;
        showCurrentFP = showCurrentFPDefault;
        showNextFP = showNextFPDefault;
        showPiecesCaptured = showPiecesCapturedDefault;
        showAdversaryScores = showAdversaryScoresDefault;
    };

    //////////////////////////////
    // Chat Methods
    //////////////////////////////

    var addChatUsers = function (gameId, msg) {

      //if (!serverGame || !serverGame.id || serverGame.id !== gameId) {
      //  return;
      //}

      // msg.userId, msg.action = [add, remove]
      // TODO: do white/black inverted colors on two players playing, everyone else is normal
      console.log("Got users for chat user list: ", msg);

      const blackPlayerId = "#" + gameId + "-" + msg.black;
      const whitePlayerId = "#" + gameId + "-" + msg.white;
      const blackContent = "<span id='" + gameId + "-" + msg.black + "'>" + msg.black + "<br/></span>";
      const whiteContent = "<span id='" + gameId + "-" + msg.white + "'>" + msg.white + "<br/></span>";

      if (!$(whitePlayerId).length) {
        $('#chatUsersContent').append(whiteContent);
      }

      if (!$(blackPlayerId).length) {
        $('#chatUsersContent').append(blackContent);
      }

    };

    var clearChatUsers = function () {
      $('#chatUsersContent').empty();
    };

    var clearChatHistory = function () {
      $('#chatOutputContent').empty();
    };

    var clearChatElements = function () {
      clearChatUsers();
      clearChatHistory();
    };

    var doRemoveChatUser = function (userId) {
      if (serverGame && serverGame.id) {
        $('#' + serverGame.id + "-" + userId).remove();
      }
    };

    var updateChat = function (gameId, userId, message) {
      $('#chatOutputContent').append("<b style='color:" + (userId === username ? "blue" : "black") + "'>[" + userId
        + "]</b> " + message + "</br>");
      updateScroll('#chatInputContent', '#chatOutputContent');
    };

    var updateScroll = function (scrollElement, contentElement) {
      $(scrollElement).scrollTop($(contentElement).prop('scrollHeight'));
    };

    var updateChatScroll = function () {
      // TODO: add logic to see if the user scrolled up so as to not jump to the bottom on them
      $('#chatInputContent').scrollTop($('#chatOutputContent').prop('scrollHeight'));
    };

    var addChatUser = function (userId) {
      // TODO; implement if adding ability to spectate
    };

    var removeChatUser = function (userId) {
      // TODO: implement if adding ability to spectate
    };

    var updateChatUserList = function () {
      // TODO: implement if adding ability to spectate
    };

    //////////////////////////////
    // Invite Methods
    //////////////////////////////

    var showAwaitingInvitation = function(invitee) {

      if (isBusyWithInvite()) {
        // First come first served, so reject invitations if the dialog is open
        socket.emit('inviterescinded', fromUser);
        return;
      }

      $('#invitee').text(invitee);
      $('#awaitingInviteResponseStatus').empty();

      $('#awaitingInviteResponse').dialog({
        dialogClass: 'no-close',
        modal: true,
        buttons: [
          {
            text: "Rescind",
            click: function () {
              socket.emit('inviterescinded', invitee);
              $(this).dialog("close");
            }
          }
        ]
      })

    };

    /**
     * Close the jquery dialog with the given id. Catches the uninitialized exception
     *
     * @param {string} id - id of the dialog to close
     */
    var closePopup = function(id) {
      try {

        if($(id).dialog("isOpen")) {
          $(id).dialog("close");
        }

      } catch(e){
        // dialog wasn't initialized so no need to close
      }
    };

    var isBusyWithInvite = function() {
      let inviting = false;
      try {
        if ($('#invitePopup').dialog("isOpen")) {
          inviting = true;
        }
      } catch(e) {
        // dialog hasn't been initialized
      }

      let responding = false;
      try {
        if ($('#awaitingInviteResponse').dialog("isOpen")) {
          responding = true;
        }
      } catch(e) {
        // dialog hasn't been initialized
      }

      return inviting === true || responding === true;

    };

    var updateAwaitingMessageAndClose = function() {
      $('#awaitingInviteResponseStatus').html("<br/>Invite rescinded. Closing...");
      setTimeout(function() {
        closePopup('#awaitingInviteResponse');
      }, 4000);
    };

    var updateInviteMessageAndClose = function() {
      $('#invitePopupStatus').html("<br/>Invite rescinded. Closing...");
      setTimeout(function() {
        closePopup('#invitePopup');
      }, 4000);
    };

    var showInvitation = function(fromUser) {

      if (isBusyWithInvite()) {
        // First come first served, so reject invitations if the dialog is open
        socket.emit('inviterescinded', fromUser);
        return;
      }

      $('#inviter').text(fromUser);
      $('#invitePopupStatus').empty();

      $('#invitePopup').dialog({
        dialogClass: "no-close",
        modal: true,
        title: "Received Game Invite",
        buttons: [
          {
            text: "Yes",
            click: function () {
              socket.emit('inviteaccepted', fromUser);

              // close, then do stuff, or close after?
              $(this).dialog("close");
            }
          },
          {
            text: "No",
            click: function() {
              socket.emit('invitedenied', fromUser);

              $(this).dialog("close");
            }
          }
        ]
      });
    };

    /**
        Shows Game Over popup

        @function showGameoverPopup
    */
    var showGameoverPopup = function(user, callback, alternateMessage) {

        // TODO: make a generic popup and then other popup functions can just call it with
        //  content

        if(!user) {
          return;
        }

        // Can set more specific info in message if you want:
        if(user !== username) {
            let content = (alternateMessage) ? alternateMessage : " resigned.";
            $('#gameoverPopupContent').html("<p>" + user + " " + content + "</p>");
        } else {
            $('#gameoverPopupContent').html("You resigned.");
        }

        $('#gameoverPopup').dialog({
            dialogClass: "no-close",
            modal: true,
            buttons: [
                {
                    text: "OK",
                    click: function() {
                        callback.call();
                        $(this).dialog("close");
                    }
                }
            ]
        });
    };

    var doResignActions = function() {
        console.log(username + " got resign message, sending to lobby...");
        socket.emit('lobby', username);
        $('#page-lobby').show();
        $('#page-game').hide();
        cleanupBoards();
        clearChatElements();
    };

    var doGameResignClick = function() {
      socket.emit('lobby', username);
      $('#page-game').hide();
      $('#page-lobby').show();
      cleanupBoards();
      clearChatElements();
    };

    var cleanupBoards = function() {

      if(board) {
        board.destroy();
      }

      if(setupBoard) {
        setupBoard.destroy();
      }

      meReady = false;
      themReady = false;;
      myStartFen = null;
      theirStartFEN = null;

    };

    //////////////////////////////
    //////////////////////////////
    // Chess Game Logic
    ////////////////////////////// 
    //////////////////////////////

    //////////////////////////////
    // Main Chess Functions
    ////////////////////////////// 

    var getDefaultPieceCapabilities = function() {
      return JSON.parse(JSON.stringify(pieceCapabilitiesDefault));
    };

    var setupGame = function () {

      // Reset things back to basic
      meReady = false;
      themReady = false;
      myStartFen = null;
      theirStartFEN = null;
      currBudget = 0;
      setupPieceCount = 0;
      resetAdminConfig();
      pieceCapabilities = getDefaultPieceCapabilities();

      // Hide stuff we should not see
      $('#game-board').hide();
      $('#set-board').show();
      $('#game-back').hide();  
      $('#startBtn').prop("disabled", false);
      $('#passBtn').prop("disabled", true);
      $('#pcomp-panel').show();
      $('#friction-panel').hide();
      $('#score-panel').hide();
      $('#black-turn').hide();
      $('#white-turn').hide();

      setupBoard = ChessBoard('set-board', {
        draggable: true,
        dropOffBoard: 'trash',
        sparePieces: true,
        showNotation: true,
        orientation: playerColor,
        onDragStart: onDragStartSetup,
        onDrop: onDropSetup
      });

      // Set up the rest of the view
      setVictoryCondition();
      updateStatus("Set your pieces for battle. Help text below the board.");
      updatePCompText();
      updatePCompValue(currBudget);

    };

    var initGame = function () {
      
      // Hide stuff we should not see
      $('#game-board').show();
      $('#set-board').hide();
      $('#game-back').hide();  
      $('#startBtn').prop("disabled", true);
      $('#pcomp-panel').hide();
      $('#friction-panel').show();
      $('#score-panel').show();
      $('#black-turn').show();
      $('#white-turn').show();
      
      // calculate starting FEN from separate fens
      let startPos = getStartPos(myStartFen, theirStartFEN);
      
      // Reset things to normal
      isGameOver = false;
      serverGame = serverGameState;

      let cfg = {
        draggable: true,
        showNotation: true, 
        orientation: playerColor,
        //position: serverGame.board ? serverGame.board : 'start',
        position: startPos ? startPos : 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
      };

      game = serverGame.board ? new Chess(serverGame.board) : new Chess(startPos);
      actualFEN = game.fen();
      cfg.position = getVisibleFEN(actualFEN);
      board = new ChessBoard('game-board', cfg);
      game.set_max_move_number(maxTurns);

      // set up the rest of the view
      updateStatus("Game Start. Max Moves: " + maxTurns);
      resetScores();
      setCurrentFrictionPiece();
      setNextFrictionPiece();
      updateFrictionPieces();
      checkVictoryCondition();
      updateScore();

      if (playerColor[0] === "w") {
        updateTurnIndicator("w");
        $('#passBtn').prop("disabled", false);
        flashTurnIndicator("w", 5);
      }

      if (playerColor[0] === "b") {
        updateTurnIndicator("w");
        $('#passBtn').prop("disabled", true);
      }

    };

    var getStartPos = function (myStartFen, theirStartFen) {

      var defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      var fenArray = defaultFEN.split(" ");
      var defaultPOS = fenArray[0];
      var fenLines = defaultPOS.split("/");

      if (typeof myStartFen === 'undefined' || myStartFen === null) {
        console.log("weird, my starting stuff should always be given");
        myStartFen = "8/8/8/8/8/8/8/8 w KQkq - 0 1";
      }

      if (typeof theirStartFen === 'undefined' || theirStartFen === null) {
        theirStartFen = "8/8/8/8/8/8/8/8 w KQkq - 0 1";
      }

      // if FEN is actual value but blank board, replace with standard layout
      if (myStartFen === "8/8/8/8/8/8/8/8"){
        myStartFen = defaultFEN;
      }

      if (theirStartFen === "8/8/8/8/8/8/8/8"){
        theirStartFen = defaultFEN;
      }

      // Pull things apart
      var blackFEN = playerColor[0].toLowerCase() === "w" ? theirStartFen : myStartFen;
      var whiteFEN = playerColor[0].toLowerCase() === "w" ? myStartFen : theirStartFen;
      var blackFENArray = blackFEN.split(" ");
      var whiteFENArray = whiteFEN.split(" ");
      var blackPOS = blackFENArray[0];
      var whitePOS = whiteFENArray[0];
      var blackLines = blackPOS.split("/");
      var whiteLines = whitePOS.split("/");

      // set black pieces
      fenLines[0] = blackLines[0];
      fenLines[1] = blackLines[1];
    
      // set white pieces
      fenLines[6] = whiteLines[6];
      fenLines[7] = whiteLines[7];

      // put them together again
      var updatedPOS = fenLines.join("/");
      fenArray[0] = updatedPOS;
      var newFEN = fenArray.join(" ");
      return newFEN;

    };

    var refreshVisibleBoard = function () {
      actualFEN = game.fen();
      visibleFEN = getVisibleFEN(actualFEN);
      board.position(visibleFEN);
    };

    var onDragStartSetup = function (source, piece, position, orientation) {
      
      // Don't let players select pieces that would bring them over budget or over the allowed piece count

      var placedPieceColor = piece[0];
      var placedPieceType = piece[1];
      var placedPiece = (placedPieceColor === "b") ? placedPieceType.toLowerCase() : placedPieceType.toUpperCase();
      var placedPieceCaps = getPieceStats(placedPiece);
      var placedPieceValue = placedPieceCaps.value;

      var tempBudget = currBudget + placedPieceValue;
      var tempPieceCount = setupPieceCount + 1;

      if (tempBudget > maxBudget && source === "spare") {
        updateStatus("Cannot select that piece: Overbudget");
        return false;
      }

      if (tempPieceCount > 16 && source === "spare") {
        updateStatus("Cannot select that piece: Piece Limit");
        return false;
      }

    };

    var onDropSetup = function (source, target, piece, newPos, oldPos, orientation) {

      var placedPieceColor = piece[0];
      var placedPieceType = piece[1];
      var placedPiece = (placedPieceColor === "b") ? placedPieceType.toLowerCase() : placedPieceType.toUpperCase();
      var placedPieceCaps = getPieceStats(placedPiece);
      var placedPieceValue = placedPieceCaps.value;
      var placedPieceRank = target[1];

      // Black pieces must be heading off the board or to the 7th and 8th rank
      if (placedPieceColor === "b") {
        if (target !== "offboard" && placedPieceRank !== "7" && placedPieceRank !== "8") {
          updateStatus("Can only place Black pieces on the 7th and 8th ranks!")
          return 'snapback';
        }
      }

      // White pieces must be heading off the board or to the 1st and 2nd rank
      if (placedPieceColor === "w") {
        if (target !== "offboard" && placedPieceRank !== "1" && placedPieceRank !== "2") {
          updateStatus("Can only place White pieces on the 1st and 2nd ranks!")
          return 'snapback';
        }
      }

      if (source === "spare") {
        currBudget += placedPieceValue;
        setupPieceCount += 1;
      }
      
      if (currBudget > maxBudget) {
        updateStatus("Cannot select that piece: Overbudget");
        currBudget -= placedPieceValue;
        return 'snapback';
      }

      if (setupPieceCount > 16) {
        updateStatus("Cannot select that piece: Piece Limit");
        setupPieceCount -= 1;
        return 'snapback';
      }

      if (target === "offboard") {
        currBudget -= placedPieceValue;
        setupPieceCount -= 1;
      }

      updatePCompValue(currBudget);
      var placedPieceName = chessPieces[placedPiece.toLowerCase()];
      updateStatus("Placed " + placedPieceName + " to " + target);

    };

    var onDragStart = function (source, piece, position, orientation) {
      // do not pick up pieces if the game is over
      // only pick up pieces for the side to move
      if (isGameOver) {
        return false;
      }
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() !== playerColor[0])) {
        return false;
      }
    };

    var onDrop = function (source, target) {

      // If both players aren't ready, then snapback until that's true
      if (!meReady || !themReady) {
        updateStatus("Waiting for other player to set up their pieces.");
        return 'snapback';
      }

      // Outright reject attempted moves by friction pieces
      // Could move this to onDragStart but this is a design choice
      // It's a bit more frustating imho to the player this way 
      // (that's what we want with friction pieces)
      var sourceType = (playerColor[0] === "w") ? game.get(source).type.toUpperCase() : game.get(source).type.toLowerCase();
      if (sourceType.toLowerCase() === getFrictionPieceByVal(currentFrictionPiece)) {
        var fpCap = getPieceStats(sourceType);
        if (fpCap.friction) {
          updateStatus("Cannot move Friction Pieces!. Rejected");
          return 'snapback';
        } else {
          updateStatus("Immune to Friction!. Accepted");
        }
      }

      // see if the move is legal
      var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
      });

      // Handling moves, during game over, when legal, and when illegal
      if (isGameOver) {
        // If the game is over (should never get herre), don't allow the move
        updateStatus("Game Over!");
        return 'snapback';
      } else if (move !== null) {
        // If the move is legal on the actual board, it'll always be legal on the visible board
        executeMove(move);
      } else if (move === null) {
        // If it's not legal on the actual board, see if it is legal on the visible board
        // Create a temp chess game based on the visible board and test out move
        var visibleGame = new Chess(visibleFEN);
        var vMove = visibleGame.move({
          from: source,
          to: target,
          promotion: 'q'
        })
        // Test to see if the move is valid
        if (vMove !== null) {
          // We have legal visible move but illegal actual move, time to modify and execute the move
          // Get the piece type as modifying illegal moves depends on the piece type
          var cpType = game.get(source).type.toLowerCase();
          var isSnapback = rectifyIllegalMoves(source, target, cpType);
          if (isSnapback) {
            return 'snapback';
          }
        } else {
          // If it's illegal on both, snapback
          updateStatus("Illegal Move Attempted. Rejected");
          return 'snapback';
        }
      }

      // check if game is over after the move is completed, end the game if so
      if (game.game_over()) {
        socket.emit('gameover', { gameId: serverGame.id, board: game.fen() });
        socket.emit('comparescores', { userID: username, gameId: serverGame.id, pColor: playerColor, scores: { KINGCAPTURE: vcKing, THREECHECK: vcChecks, MATERIAL: vcMaterial, PIECES: vcPieces, Condition: myVictoryCondition } });
        sentScores = true;
        showGameOver();
      }

    };

    var onSnapEnd = function () {
      // update the board position after the piece snap 
      // for castling, en passant, pawn promotion
      visibleFEN = getVisibleFEN(game.fen());
      board.position(visibleFEN);
    };

    var updateStatus = function (message) {
      // Update status message
      var statusMsg = message;
      if (typeof game !== 'undefined' && game !== null) {
        var turn_num = (playerColor === "black") ? getMoveNumberFEN(game.fen()) - 1 : getMoveNumberFEN(game.fen());
        if (!isGameOver) {
          statusMsg += ". :: Turn " + Math.max(1, turn_num) + " of " + maxTurns + ".";
        } else {
          statusMsg = message;
        }
      } 
      document.getElementById("status-text").innerHTML = statusMsg;
    };

    var updatePCompValue = function (budget) {
      var pcString = "Victory Condition: " + myVictoryCondition + " :: ";
      pcString += "Current Budget: " + budget + " / " + maxBudget + ".";
      document.getElementById("pcomp-value").innerHTML = pcString;
    };

    var updatePCompText = function (message = null) {
      if (typeof message === 'undefined' || message === null) {
        message = "Drag desired pieces onto board in first two rows only.";
        message += "</br>";
        message += "Be careful, you must stay within budget!";
        message += "</br>";
        message += "To remove pieces, drag them off the board.";
        message += "</br>";
        message += "<b>Minimum Requirement: YOU MUST PLACE YOUR KING!</b>";
        message += "</br>";
        message += "<b>CLICK START WHEN DONE, IF BOARD IS BLANK THE DEFAULT CHESS LAYOUT WILL BE USED.</b>";
      }
      document.getElementById("pcomp-text").innerHTML = message;
    };

    var updateFrictionPieces = function () {
      
      var currFP = (playerColor[0] === "w") ? getFrictionPieceByVal(currentFrictionPiece).toUpperCase() : getFrictionPieceByVal(currentFrictionPiece).toLowerCase();
      var nextFP = (playerColor[0] === "w") ? getFrictionPieceByVal(nextFrictionPiece).toUpperCase() : getFrictionPieceByVal(nextFrictionPiece).toLowerCase();
      var currFPCap = getPieceStats(currFP);
      var nextFPCap = getPieceStats(nextFP);      
      var currImmunity = (currFPCap.friction) ? " (Active)" : " (Immune)";
      var nextImmunity = (nextFPCap.friction) ? " (Active)" : " (Immune)";
      
      var fpString = "";
      if (showCurrentFP) {
        fpString += "Current: " + currentFrictionPiece + currImmunity;
      }
      if (showCurrentFP && showNextFP) {
        fpString += "</br>";
      }
      if (showNextFP) {
        fpString += "Next: " + nextFrictionPiece + nextImmunity;
      }
      if (fpString === "") {
        fpString = "Unknown!"
      }
      document.getElementById("friction-text").innerHTML = fpString;
    };

    var updateScore = function () {
      let vcString;
      if (showScores && showAdversaryScores) {
        vcString = "Victory Condition: " + myVictoryCondition + "&nbsp;&nbsp;&nbsp;[Adversary's Score]";
        vcString += "</br>";
        vcString += "King Capture: " + vcKing + " [" + advScores.KINGCAPTURE + "]</br>";
        vcString += "Number of Checks: " + vcChecks + " [" + advScores.THREECHECK + "]</br>";
        vcString += "Material Captured: " + vcMaterial + " [" + advScores.MATERIAL + "]</br>";
        vcString += "Pieces Captured: " + vcPieces + " [" + advScores.PIECES + "]";
      } else if (showScores && !showAdversaryScores) {
        vcString = "Victory Condition: " + myVictoryCondition;
        vcString += "</br>"
        vcString += "King Capture: " + vcKing + "</br>";
        vcString += "Number of Checks: " + vcChecks + "</br>";
        vcString += "Material Captured: " + vcMaterial + "</br>";
        vcString += "Pieces Captured: " + vcPieces;
      } else if (!showScores && showAdversaryScores) {
        vcString = "Victory Condition: " + myVictoryCondition;
        vcString += "</br>"
        vcString += "Adversary's King Capture: " + advScores.KINGCAPTURE + "</br>";
        vcString += "Adversary's Number of Checks: " + advScores.THREECHECK + "</br>";
        vcString += "Adversary's Material Captured: " + advScores.MATERIAL + "</br>";
        vcString += "Adversary's Pieces Captured: " + advScores.PIECES;
      } else {
        vcString = "Victory Condition: " + myVictoryCondition
      }
      if (showPiecesCaptured) {
        if (piecesCaptured)
          vcString += "</br></br>"
        vcString += "Captured:</br>" + piecesCaptured.slice(0, -2);
      }
      document.getElementById("score-text").innerHTML = vcString;
    };

    var showGameOver = function () {
      isGameOver = true;
      $('#white-turn').hide();
      $('#black-turn').hide();
      $('#game-back').show();     
      $('#passBtn').prop("disabled", true);
      updateStatus("Game Over!");
    };

    var showVictories = function (oppScores) {

      // Hide all the friction pieces as the game is over:
      document.getElementById("friction-text").innerHTML = "None: Game Over!";

      // Did I win or lose? Could combine with opponents but keep separate in case we evolve the logic
      var myWin = "NO Victory!";
      if (myVictoryCondition === victoryConditions.KINGCAPTURE) {
        if (vcKing) {
          // King capture and I did it
          myWin = "TOTAL VICTORY!!!";
        }
      } else if (myVictoryCondition === victoryConditions.THREECHECK) {
        // If i got more than 3 checks I win
        if (vcChecks >= 3) {
          myWin = "VICTORY!";
        }
      } else if (myVictoryCondition === victoryConditions.MATERIAL) {
        // If my material captured was more I win
        if (vcMaterial > oppScores.MATERIAL) {
          myWin = "VICTORY!";
        }
      } else if (myVictoryCondition === victoryConditions.PIECES) {
        // If my pieces captured was more I win
        if (vcPieces > oppScores.PIECES) {
          myWin = "VICTORY!";
        }
      } else {
        console.error("Invalid victory condition found while calculating victories");
        myWin = "Uknown?";
      }

      // Did they win or lose? Could combine with mine but keep separate in case we evolve the logic
      var theirWin = "NO Victory!";
      if (oppScores.Condition === victoryConditions.KINGCAPTURE) {
        if (oppScores.KINGCAPTURE) {
          // King capture and I did it
          theirWin = "TOTAL VICTORY!!!";
        }
      } else if (oppScores.Condition === victoryConditions.THREECHECK) {
        // If i got more than 3 checks I win
        if (oppScores.THREECHECK >= 3) {
          theirWin = "VICTORY!";
        }
      } else if (oppScores.Condition === victoryConditions.MATERIAL) {
        // If my material captured was more I win
        if (oppScores.MATERIAL > vcMaterial) {
          theirWin = "VICTORY!";
        }
      } else if (oppScores.Condition === victoryConditions.PIECES) {
        // If my pieces captured was more I win
        if (oppScores.PIECES > vcPieces) {
          theirWin = "VICTORY!";
        }
      } else {
        console.error("Invalid victory condition found while calculating opp victories");
        theirWin = "Uknown?";
      }

      // Build string for scores
      var vcString = "Victory Condition: " + myVictoryCondition + " -> " + myWin + "    ";
      vcString += "[" + oppScores.Condition + " -> " + theirWin + "]";
      vcString += "</br>"
      vcString += "King Capture: " + vcKing + " [" + oppScores.KINGCAPTURE + "];   ";
      vcString += "Number of Checks: " + vcChecks + " [" + oppScores.THREECHECK + "];   ";
      vcString += "Material Captured: " + vcMaterial + " [" + oppScores.MATERIAL + "];   ";
      vcString += "Pieces Captured: " + vcPieces + " [" + oppScores.PIECES + "]";

      // Print to screen
      document.getElementById("score-label").innerHTML = "Scoring: [Opponents results in brackets]";
      document.getElementById("score-text").innerHTML = vcString;

    };

    var resetScores = function() {
        vcKing = false;
        vcChecks = 0;
        vcMaterial = 0;
        vcPieces = 0;
        piecesCaptured = [];
        advScores = advScoresDefault;
    };

    var executeMove = function (eMove) {
      // Should only call this if you know the move is valid already!
      // Execute the move, emit it to the other player, update the game status
      socket.emit('move', { move: eMove, gameId: serverGame.id, board: game.fen() });
      updateStatus("Move Accepted. From " + eMove.from + " To " + eMove.to);
      // Cycle Friction Pieces and update the fp status
      setCurrentFrictionPiece(nextFrictionPiece);
      setNextFrictionPiece();
      updateFrictionPieces();
      // Check for scoring updates and update the score status
      checkScores(eMove);
      socket.emit('sendscores', { userID: username, gameId: serverGame.id, pColor: playerColor, scores: { KINGCAPTURE: vcKing, THREECHECK: vcChecks, MATERIAL: vcMaterial, PIECES: vcPieces } });
      updateScore();
      var tColor = (playerColor[0].toLowerCase() === "w") ? "b" : "w";
      updateTurnIndicator(tColor);
      $('#passBtn').prop("disabled", true);
    };

    var handlePass = function() {
      // Should only call this from the pass button!
      // Perform pass move
      game.move("pass");
      // Emit it to the other player, update the game status
      socket.emit('move', { move: "pass", gameId: serverGame.id, board: game.fen() });
      updateStatus("Successfully Passed");
      // Cycle Friction Pieces and update the fp status
      setCurrentFrictionPiece(nextFrictionPiece);
      setNextFrictionPiece();
      updateFrictionPieces();
      // Check for scoring updates and update the score status
      checkScoresPass();
      socket.emit('sendscores', { userID: username, gameId: serverGame.id, pColor: playerColor, scores: { KINGCAPTURE: vcKing, THREECHECK: vcChecks, MATERIAL: vcMaterial, PIECES: vcPieces } });
      updateScore();
      var tColor = (playerColor[0].toLowerCase() === "w") ? "b" : "w";
      updateTurnIndicator(tColor);
      $('#passBtn').prop("disabled", true);

      // check if game is over after the move is completed, end the game if so
      if (game.game_over()) {
        socket.emit('gameover', { gameId: serverGame.id, board: game.fen() });
        socket.emit('comparescores', { userID: username, gameId: serverGame.id, pColor: playerColor, scores: { KINGCAPTURE: vcKing, THREECHECK: vcChecks, MATERIAL: vcMaterial, PIECES: vcPieces, Condition: myVictoryCondition } });
        sentScores = true;
        showGameOver();
      }

    };

    //////////////////////////////
    // Chess Helper Methods
    ////////////////////////////// 

    var getVisibleFEN = function (actualFEN) {
      // Hiding opponent's pieces
      var actualGrid = fenToGrid(actualFEN);
      var visibleGrid = getVisibleGrid(actualGrid);
      var visibleFENPos = gridToFenPos(visibleGrid);
      var visibleFEN = updateFenPos(visibleFENPos, actualFEN);

      return visibleFEN;

    };

    var getVisibleGrid = function (grid) {
      // Return the game board with only visible pieces
      // Make a copy of the grid for editing (don't want to edit the actual grid)
      var vGrid = [];
      for (var i = 0; i < 8; i++) {
        var temp = [];
        for (var j = 0; j < 8; j++) {
          temp.push(grid[i][j]);
        }
        vGrid.push(temp);
      }

      // Generate all moves for both sides (only do this once per check)
      var myMoveColor = playerColor[0].toLowerCase();
      var theirMoveColor = (playerColor[0].toLowerCase() === "w") ? "b" : "w";
      var allMyMoves = getMoves(game.fen(), myMoveColor);
      var allTheirMoves = getMoves(game.fen(), theirMoveColor);

      // Loop over each square and test if it should be visible or not
      for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {

          // Get current piece from original grid
          var currPiece = grid[i][j];
          var currSquare = gridIndexToSquare(i, j);

          // Don't Change anything if the square is empty
          if (currPiece === "-") {
            continue;
          }

          // Don't Change anything if the piece is your color
          if (playerColor === "white" && currPiece === currPiece.toUpperCase()) {
            continue;
          }
          if (playerColor === "black" && currPiece === currPiece.toLowerCase()) {
            continue;
          }

          // Get the pieces capabilities
          var pCaps = getPieceStats(currPiece);

          // If you are still here, you've found a piece of the other players
          // Can I see it? If yes, then leave it, else, change it to "-"
          // Test to see if you have a piece within range
          var rangeTest = runRangeTest(grid, i, j, playerColor);
          var inRange = rangeTest[0];
          var maxJamming = rangeTest[1];
          if (inRange) {
            // If we are within range, check to see abou the sight strength and jamming
            // Change to strict > if jamming wins the tie
            if (pCaps.sightStrength >= maxJamming) {
              // We can see through the worst of the jamming
              // We can see the piece, leave it along
              continue;
            }
          }

          // Threatening logic: show the current piece if it is attacking you
          if (isThreatening(allTheirMoves, currSquare)) {
            continue;
          }

          // Threatened logic: show the current piece if you are attacking it
          if (isThreatened(allMyMoves, currSquare)) {
            continue;
          }

          // If you are still here, the piece is not visible
          vGrid[i][j] = "-";

        }
      }

      return vGrid;

    };

    var fenToGrid = function (fen) {
      // Convert FEN to grid for easier editing
      // Deconstruct FEN position elements
      var fenArray = fen.split(" ");
      var fenPos = fenArray[0];

      // Deconstruct FEN position
      var fenLines = fenPos.split("/");
      if (fenLines.length != 8) {
        throw new Error("Problem parsing FEN, not enough lines found.");
      }

      // Convert each line to an array and add the array to the grid array
      var grid = [];
      for (var i = 0; i < fenLines.length; i++) {
        var dirtyRank = fenLines[i].split("");
        var cleanRank = [];
        for (var j = 0; j < dirtyRank.length; j++) {
          if (!isNaN(parseInt(dirtyRank[j], 10))) {
            // Found a number.
            var emptySpaces = dirtyRank[j];
            for (var k = 0; k < emptySpaces; k++) {
              cleanRank.push("-");
            }
          } else {
            // Found a piece, add this
            cleanRank.push(dirtyRank[j]);
          }
        }
        if (cleanRank.length != 8) {
          throw new Error("Problem parsing FEN, failed to translate numbers correctly.");
        }
        grid.push(cleanRank);
      }

      return grid;

    };

    var gridToFenPos = function (grid) {
      // Convert grid back into a FEN position string
      // Loop over grid and build up string
      if (grid.length != 8 || grid[0].length != 8) {
        throw new Error("Problem converting grid to fen, initial dim check on pos failed.");
      }
      var fenPos = "";
      for (var i = 0; i < 8; i++) {
        var tempNum = 0;
        for (var j = 0; j < 8; j++) {
          var tempChar = grid[i][j];
          // If the current space is not empty
          if (tempChar != "-") {
            // if the spaces before in the row were empty
            if (tempNum > 0) {
              // write the number of empty spots and reset the counter
              fenPos += tempNum;
              tempNum = 0;
            }
            // write the current space
            fenPos += tempChar;
          } else {
            // incriment empty space counter
            tempNum++;
          }
        }
        if (tempNum > 0) {
          fenPos += tempNum;
        }
        fenPos += "/";
      }
      return fenPos.substring(0, fenPos.length - 1);
    };

    var updateFenPos = function (pos, originalFEN) {
      // Replace the position element in the original FEN
      var fenArray = originalFEN.split(" ");
      fenArray[0] = pos;
      var newFEN = fenArray.join(" ");
      return newFEN;
    };

    var getPieceStats = function (piece) {
      // Get piece viz range (piece is case sensitive upper=white, lower=black)

      var validPieces = ["k", "q", "r", "n", "b", "p", "K", "Q", "R", "N", "B", "P"]

      // Make sure peice is contained within the valid pieces
      if (validPieces.indexOf(piece) <= -1) {
        throw "Value Error: invalid piece passed to getPieceStats in default.js";
      }

      var pieceStats = pieceCapabilities[piece];

      return pieceStats;

    };

    var getMoves = function (fen, moveColor) {
      // Get all moves of the specified moveColor given the fen 
      // regardless of whose turn it is
      // moveColor should be either "w" or "b", only these.
      if (!(moveColor === "w" || moveColor === "b")) {
        throw "Invalid moveColor in getMoves";
      }

      // Change the FEN so that it looks like the players turn for moveColor
      var fenArray = fen.split(" ");
      fenArray[1] = moveColor;  // Set the fen to the desired color
      fenArray[2] = "-";  // Reset all castling (avoid invalid FENs)
      fenArray[3] = "-";  // Reset all en passant (avoid invalid FENs)
      fenArray[4] = 0;  // reset any half moves (avoid invalid FENs)

      var fixedFen = fenArray.join(" ");
      var fenCheck = game.validate_fen(fixedFen);

      if (!fenCheck.valid) {
        console.log("My Turn FEN Issue:");
        console.log(fenCheck);
      }

      // Create a hidden chess game so you can calc all moves
      var tempGame = new Chess(fixedFen)
      tempGame.set_max_move_number = 1000;  // Just in case (avoid invalid FENs)
      var myMoves = tempGame.moves({ verbose: true });

      return myMoves;

    };

    var getMoveNumberFEN = function (fen) {
      // Get the move number from the fen
      var fenArray = fen.split(" ");
      var fenMoveNum = fenArray[5];
      return fenMoveNum;
    };

    var getPlayerColorFEN = function (fen) {
      // Get player color from fen
      var fenArray = fen.split(" ");
      var fenColor = fenArray[1];
      return fenColor;
    };

    var gridIndexToSquare = function (i, j) {
      // Convert i, j indexes of grid into a board square
      var indMap = { 1: "a", 2: "b", 3: "c", 4: "d", 5: "e", 6: "f", 7: "g", 8: "h" };
      // Convert (squares are base 1, grid is base 0)
      var sqrRank = indMap[j + 1];
      var sqrFile = (8 - i).toString();

      var sqr = sqrRank + sqrFile;

      return sqr;

    };

    var squareToGridIndex = function (sqr) {
      // Convert square value to grid index
      currRank = sqr[0];
      currFile = sqr[1];

      var sqrMap = { "a": 1, "b": 2, "c": 3, "d": 4, "e": 5, "f": 6, "g": 7, "h": 8 };

      // Convert (squares are base 1, grid is base 0) 
      var j = sqrMap[currRank] - 1;
      //var j = 8 - parseInt(currFile);
      var i = 8 - parseInt(currFile);

      return [i, j];

    };

    var runRangeTest = function (grid, i, j, pColor) {
      // Tests to see if the piece at i, j in the grid is observable by any piece of pColor
      // Want to find a piece of pColor that has the current piece in range and keep track of max jamming value

      var inRange = false;
      var maxJamming = 0;

      var currPiece = grid[i][j];

      // Loop over each square of the board, test if the piece is the right color, and if so, test if it can see i, j
      for (var x = 0; x <= 7; x++) {
        for (var y = 0; y <= 7; y++) {

          var testPiece = grid[x][y];

          // Skip if there is no piece
          if (testPiece === "-") {
            continue;
          }

          var testPieceCaps = getPieceStats(testPiece);
          var tpViewRange = testPieceCaps.viewRange;

          // Test to see if the piece is the color we are looking for

          if ((pColor === "white" && testPiece === testPiece.toUpperCase()) ||
            (pColor === "black" && testPiece === testPiece.toLowerCase())) {

            // These values will always be between 0 and 7 as both (i, j) and (x, y)
            // are generated from looping over 0 to 7. No additional checks for now.
            var xDist = Math.abs(x - i);
            var yDist = Math.abs(y - j);

            // Test to see if the piece is in range
            // Both xDist and yDist must be within the view range
            if (xDist <= tpViewRange && yDist <= tpViewRange) {
              // Set in range
              inRange = true;
              // Capture and test jamming value
              if (testPieceCaps.jammingValue > maxJamming) {
                maxJamming = testPieceCaps.jammingValue;
              }
            }

          }

        }
      }

      return [inRange, maxJamming];

    };

    var isThreatening = function (theirMoves, square) {
      // Threatening logic: show the current piece if it is attacking you
      var threatening = false;

      for (var m = 0; m < theirMoves.length; m++) {

        var currFlags = theirMoves[m].flags;

        // If the flag string contains a c (standard capture) or e (en passant capture)
        if (currFlags.includes("c") || currFlags.includes("e")) {

          // Capture that begins from the current square in question
          if (theirMoves[m].from === square) {

            // The piece in question can indeed capture an opponent piece.
            // Show if the attacked piece has the capability to been see
            var attackedPiece = game.get(theirMoves[m].to);
            var apCaps;
            if (attackedPiece.color === "w") {
              apCaps = getPieceStats(attackedPiece.type.toUpperCase());
            }
            else if (attackedPiece.color === "b") {
              apCaps = getPieceStats(attackedPiece.type.toLowerCase());
            }

            // If piece has capability return true
            if (apCaps.showThreatening) {
              threatening = true;
            }

          }
        }
      }

      return threatening;

    };

    var isThreatened = function (myMoves, square) {
      // Threatened logic: show the current piece you are attaching it
      var threatened = false;

      for (var m = 0; m < myMoves.length; m++) {

        var currFlags = myMoves[m].flags;

        // If the flag string contains a c (standard capture) or e (en passant capture)
        if (currFlags.includes("c") || currFlags.includes("e")) {

          // Capture that begins from the current square in question
          if (myMoves[m].to === square) {

            // The piece in question can be captured
            // Show if the attacking piece has the ability
            var attackingPiece = game.get(myMoves[m].from);
            var agCaps;
            if (attackingPiece.color === "w") {
              agCaps = getPieceStats(attackingPiece.type.toUpperCase());
            }
            else if (attackingPiece.color === "b") {
              agCaps = getPieceStats(attackingPiece.type.toLowerCase());
            }

            // If piece has capability return true
            if (agCaps.showThreatened) {
              threatened = true;
            }

          }
        }
      }

      return threatened;

    };

    var rectifyIllegalMoves = function (source, target, pieceType) {

      var isSnapback = false;

      // If the type is a king or knight, reject the move as we should actually never see this
      // This is because kings only move one square and can't get blocked, they'd just capture a hidden target
      // For knights, this is true since they are never blocked, they'd just capture a hidden target
      if (pieceType === "k" || pieceType === "n") {
        console.log("Weird peice found during illegal move remediation: " + pieceType);
        isSnapback = true;
      }
      // Handle pawn cases
      if (pieceType == "p") {
        isSnapback = relaxIllegalPawnMove(source, target);
      }
      // Handle rook cases
      if (pieceType == "r") {
        var sourceIdx = squareToGridIndex(source);
        var targetIdx = squareToGridIndex(target);
        // Determine if we're moving left or right or up or down
        if (sourceIdx[0] === targetIdx[0]) {
          // left or right
          isSnapback = relaxIllegalHorizontalMove(source, target, pieceType);
        } else if (sourceIdx[1] === targetIdx[1]) {
          // up or down
          isSnapback = relaxIllegalVerticalMove(source, target, pieceType);
        } else {
          // Should never get here
          console.error("Bad rook move in processing illegal moves?");
          isSnapback = true;
        }
      }
      // Handle bishop cases
      if (pieceType == "b") {
        var sourceIdx = squareToGridIndex(source);
        var targetIdx = squareToGridIndex(target);
        // Determine which diagonal we're working on, from white's perspective
        if ((sourceIdx[0] > targetIdx[0]) && (sourceIdx[1] > targetIdx[1])) {
          // up and left diagonal direction
          isSnapback = relaxIllegalDiagonalMove(source, target, "ul", pieceType);
        } else if ((sourceIdx[0] > targetIdx[0]) && (sourceIdx[1] < targetIdx[1])) {
          // up and right diagonal direction
          isSnapback = relaxIllegalDiagonalMove(source, target, "ur", pieceType);
        } else if ((sourceIdx[0] < targetIdx[0]) && (sourceIdx[1] < targetIdx[1])) {
          // down and right diagonal direction
          isSnapback = relaxIllegalDiagonalMove(source, target, "dr", pieceType);
        } else if ((sourceIdx[0] < targetIdx[0]) && (sourceIdx[1] > targetIdx[1])) {
          // down and left diagonal direction
          isSnapback = relaxIllegalDiagonalMove(source, target, "dl", pieceType);
        } else {
          // Should never get here
          console.error("Bad bishop move in processing illegal moves?");
          isSnapback = true;
        }
      }
      // Handle queen cases
      if (pieceType == "q") {
        var sourceIdx = squareToGridIndex(source);
        var targetIdx = squareToGridIndex(target);
        // Determine if we're moving left or right or up or down or along one of the diagonals
        if (sourceIdx[0] === targetIdx[0]) {
          // left or right
          isSnapback = relaxIllegalHorizontalMove(source, target, pieceType);
        } else if (sourceIdx[1] === targetIdx[1]) {
          // up or down
          isSnapback = relaxIllegalVerticalMove(source, target, pieceType);
        } else if ((sourceIdx[0] > targetIdx[0]) && (sourceIdx[1] > targetIdx[1])) {
          // up and left diagonal direction
          isSnapback = relaxIllegalDiagonalMove(source, target, "ul", pieceType);
        } else if ((sourceIdx[0] > targetIdx[0]) && (sourceIdx[1] < targetIdx[1])) {
          // up and right diagonal direction
          isSnapback = relaxIllegalDiagonalMove(source, target, "ur", pieceType);
        } else if ((sourceIdx[0] < targetIdx[0]) && (sourceIdx[1] < targetIdx[1])) {
          // down and right diagonal direction
          isSnapback = relaxIllegalDiagonalMove(source, target, "dr", pieceType);
        } else if ((sourceIdx[0] < targetIdx[0]) && (sourceIdx[1] > targetIdx[1])) {
          // down and left diagonal direction
          isSnapback = relaxIllegalDiagonalMove(source, target, "dl", pieceType);
        } else {
          // Should never get here
          console.error("Bad queen move in processing illegal moves?");
          isSnapback = true;
        }
      }

      if (isSnapback) {
        return true;
      } else {
        return false;
      }

    };

    var relaxIllegalPawnMove = function (source, target) {
      // If we're here then the pawn move is blocked, otherwise it would be a valid move on the actual board
      // When we are here the actual boarrd is not valid and the visible move is
      // We'll try by backing up the target one space
      // If it's blocked by the immediate square in front then this will fail as the move will be a non-move
      // If it's blocked by two squares ahead, then will will try to move up one if that's valid
      var sourceIdx = squareToGridIndex(source);
      var targetIdx = squareToGridIndex(target);
      var newTIdx = (targetIdx[0] > sourceIdx[0]) ? sourceIdx[0] + 1 : sourceIdx[0] - 1;
      var newTarget = gridIndexToSquare(newTIdx, sourceIdx[1]);
      // The new target is now either the source square (in which no valid moves are returned)
      // OR, the new target is one square ahead of the pawn, so we'll try to move there
      var newMove = game.move({
        from: source,
        to: newTarget,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
      });
      if (newMove !== null) {
        // If the move is valid, let's register it and progress the game
        executeMove(newMove);
        return false;
      } else {
        // At this point the player gets to move to the source point, which they just get for free
        // There is a weird edge case here when view range = 0, the user will learn for free a piece is directly ahead of it
        updateStatus("Illegal Modified Move Attempted. Rejected");
        return true;
      }
    };

    var relaxIllegalHorizontalMove = function (source, target, pieceType) {
      var sourceIdx = squareToGridIndex(source);
      var targetIdx = squareToGridIndex(target);
      var newTarget = "";
      var newTIdx = sourceIdx[1];
      var stopper = 0;  // Last resort inf loop protection
      var blocked = false;
      while ((stopper < 8) && (newTarget !== target) && (!blocked)) {
        newTIdx = (targetIdx[1] > sourceIdx[1]) ? newTIdx + 1 : newTIdx - 1;
        newTarget = gridIndexToSquare(sourceIdx[0], newTIdx);
        var blockingPiece = game.get(newTarget);
        if (blockingPiece !== null) {
          blocked = true;
        }
        stopper++;
      }
      if (blocked) {
        // Reverse the last step in the move
        newTIdx = (targetIdx[1] > sourceIdx[1]) ? newTIdx - 1 : newTIdx + 1;
        newTarget = gridIndexToSquare(sourceIdx[0], newTIdx);
        // Generate new move
        var newMove = game.move({
          from: source,
          to: newTarget,
          promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });
        // Process new move
        if (newMove !== null) {
          executeMove(newMove);
          return false;
        } else {
          // Bad move modification, should hit only on errors and when view range = 0, like pawns
          updateStatus("Illegal Modified Move Attempted. Rejected - " + pieceType);
          return true;
        }
      } else {
        // exited under last resort measures, not good
        updateStatus("Illegal Unblocked Modified Move Attempted. Rejected - " + pieceType);
        return true;
      }
    };

    var relaxIllegalVerticalMove = function (source, target, pieceType) {
      var sourceIdx = squareToGridIndex(source);
      var targetIdx = squareToGridIndex(target);
      var newTarget = "";
      var newTIdx = sourceIdx[0];
      var stopper = 0;  // Last resort inf loop protection
      var blocked = false;
      while ((stopper < 8) && (newTarget !== target) && (!blocked)) {
        newTIdx = (targetIdx[0] > sourceIdx[0]) ? newTIdx + 1 : newTIdx - 1;
        newTarget = gridIndexToSquare(newTIdx, sourceIdx[1]);
        var blockingPiece = game.get(newTarget);
        if (blockingPiece !== null) {
          blocked = true;
        }
        stopper++;
      }
      if (blocked) {
        // Reverse the last step in the move
        newTIdx = (targetIdx[0] > sourceIdx[0]) ? newTIdx - 1 : newTIdx + 1;
        newTarget = gridIndexToSquare(newTIdx, sourceIdx[1]);
        // Generate new move
        var newMove = game.move({
          from: source,
          to: newTarget,
          promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });
        // Process new move
        if (newMove !== null) {
          executeMove(newMove);
          return false;
        } else {
          // Bad move modification, should hit only on errors and when view range = 0, like pawns
          updateStatus("Illegal Modified Move Attempted. Rejected - " + pieceType);
          return true;
        }
      } else {
        // exited under last resort measures, not good
        updateStatus("Illegal Unblocked Modified Move Attempted. Rejected - " + pieceType);
        return true;
      }
    };

    var relaxIllegalDiagonalMove = function (source, target, direction, pieceType) {
      var sourceIdx = squareToGridIndex(source);
      var targetIdx = squareToGridIndex(target);
      var newTarget = "";
      var newXIdx = sourceIdx[0];
      var newYIdx = sourceIdx[1];
      var stopper = 0;  // Last resort inf loop protection
      var blocked = false;
      while ((stopper < 8) && (newTarget !== target) && (!blocked)) {
        if (direction === "ul") {
          newXIdx = newXIdx - 1;  // newXIdx--
          newYIdx = newYIdx - 1;  // newYIdx--
        } else if (direction === "ur") {
          newXIdx = newXIdx - 1;  // newXIdx--
          newYIdx = newYIdx + 1;  // newYIdx++
        } else if (direction === "dr") {
          newXIdx = newXIdx + 1;  // newXIdx++
          newYIdx = newYIdx + 1;  // newYIdx++
        } else if (direction === "dl") {
          newXIdx = newXIdx + 1;  // newXIdx++
          newYIdx = newYIdx - 1;  // newYIdx--
        } else {
          console.error("Bad diagonal direction found in diagonal move relaxation");
        }
        newTarget = gridIndexToSquare(newXIdx, newYIdx);
        var blockingPiece = game.get(newTarget);
        if (blockingPiece !== null) {
          blocked = true;
        }
        stopper++;
      }
      if (blocked) {
        // Reverse the last step in the move
        if (direction === "ul") {
          newTarget = gridIndexToSquare(newXIdx + 1, newYIdx + 1);
        } else if (direction === "ur") {
          newTarget = gridIndexToSquare(newXIdx + 1, newYIdx - 1);
        } else if (direction === "dr") {
          newTarget = gridIndexToSquare(newXIdx - 1, newYIdx - 1);
        } else if (direction === "dl") {
          newTarget = gridIndexToSquare(newXIdx - 1, newYIdx + 1);
        } else {
          console.error("Bad diagonal direction found in diagonal move relaxation");
        }
        // Generate new move
        var newMove = game.move({
          from: source,
          to: newTarget,
          promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });
        // Process new move
        if (newMove !== null) {
          executeMove(newMove);
          return false;
        } else {
          // Bad move modification, should hit only on errors and when view range = 0, like pawns
          updateStatus("Illegal Modified Move Attempted. Rejected - " + pieceType);
          return true;
        }
      } else {
        // exited under last resort measures, not good
        updateStatus("Illegal Unblocked Modified Move Attempted. Rejected - " + pieceType);
        return true;
      }
    };

    var checkScores = function (eMove) {
      // If a piece was captured, add it's value to material and increment pieces captured
      // If the captured piece is a king or the game is checkmate, update king capture
      if (eMove.captured) {
        var pColor = eMove.color;
        var cPiece = (pColor === "b") ? eMove.captured.toLowerCase() : eMove.captured.toUpperCase();
        var pieceCaps = getPieceStats(cPiece);
        var pVal = pieceCaps.value;
        vcPieces = vcPieces + 1;
        vcMaterial = vcMaterial + pVal;
        piecesCaptured += chessPieces[cPiece.toLowerCase()] + ", ";
        // If the piece being captured is a king (at this point could only be the other player's) or the game is in checkmate
        if (eMove.captured.toLowerCase() === "k") {
          vcKing = true;
          if (dualKingCapture) {
            // trigger game over
            game.game_over(true);
          }
        }
      }

      // Check if the move give the person a check (thanks chess.js)
      var inCheck = game.in_check();
      if (inCheck) {
        vcChecks = vcChecks + 1;
      }

    };

    var checkScoresPass = function () {
      // No move means no captures, so best we can do is add a check to the board.
      var inCheck = game.in_check();
      if (inCheck) {
        vcChecks = vcChecks + 1;
      }
    };

    var checkKingCapture = function (msg) {
      // if we both do, set max turns on the game really high change the status
      if (username !== msg.userID) {
        if (msg.condition === victoryConditions.KINGCAPTURE) {
          if (myVictoryCondition === victoryConditions.KINGCAPTURE) {
            dualKingCapture = true;
            //game.set_max_move_number(300);
            maxTurns = "Inf";
            updateStatus("Dual King Capture Found! Max moves now unlimited: " + maxTurns);
          }
        }
      }
    };

    var getRandomVC = function () {
      var vcArray = Object.keys(victoryConditions);
      var index = getRandomInt(0, vcArray.length);
      var vcKey = vcArray[index];
      var vcVal = victoryConditions[vcKey];
      return vcVal;
    };

    var getNextFP = function () {
      var fpArray = Object.keys(chessPieces);
      var index = getRandomInt(0, fpArray.length);
      var fpKey = fpArray[index];
      var fpVal = chessPieces[fpKey];
      return fpVal;
    };

    var setVictoryCondition = function (vc = null) {
      if (vc !== null) {
        myVictoryCondition = vc.repeat(1);  // hack found in js docs for copying the string value, not referencing
      } else {
        myVictoryCondition = getRandomVC();
      }
    };

    var checkVictoryCondition = function () {
      if (myVictoryCondition === victoryConditions.KINGCAPTURE) {
        socket.emit('kingcapture', { userID: username, gameId: serverGame.id, pColor: playerColor, condition: victoryConditions.KINGCAPTURE });
      }
    };

    var setCurrentFrictionPiece = function (fp = null) {
      if (fp !== null) {
        currentFrictionPiece = fp.repeat(1);  // hack found in js docs for copying the string value, not referencing
      } else {
        currentFrictionPiece = getNextFP();
      }
    };

    var setNextFrictionPiece = function (fp = null) {
      if (fp !== null) {
        nextFrictionPiece = fp.repeat(1);  // hack found in js docs for copying the string value, not referencing
      } else {
        nextFrictionPiece = getNextFP();
      }
    };

    var getFrictionPieceByVal = function (val) {
      var fpKeys = Object.keys(chessPieces);
      var fpVal = fpKeys.find(key => chessPieces[key] === val);
      return fpVal;
    };

    var getVictoryConditionByVal = function (val) {
      var vcKeys = Object.keys(victoryConditions);
      var vcVal = vcKeys.find(key => victoryConditions[key] === val);
      return vcVal;
    };

    var isValidSetup = function() {
      
      var testBoard = setupBoard.fen();

      // If the test baord is blank, this is fine, return valid
      if (testBoard === "8/8/8/8/8/8/8/8") {
        return true;
      }

      // If the test board find the right color king, return valid
      var kingPiece = (playerColor[0] === "w") ? "K" : "k";
      if (testBoard.indexOf(kingPiece) !== -1) {
        return true;
      }

      // If not blank and no king of your color, return invalid
      updateStatus("Unempty Setup must have a King of your color");
      return false;

    };

    //////////////////////////////
    //////////////////////////////
    // Generic Utilities
    ////////////////////////////// 
    //////////////////////////////

    var getRandomInt = function (min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    };

    var updateTurnIndicator = function (turnColor) {
      if (turnColor[0].toLowerCase() === "w") {
        setWhiteTurn();
      } else if (turnColor[0].toLowerCase() === "b") {
        setBlackTurn();
      } else {
        console.error("Found a spurious turn color when updating the turn indicator");
      }
    };

    var flashTurnIndicator = function (turnColor, numBlinks) {
      
      if (turnColor[0].toLowerCase() === "w") {
        for (var i = 0; i < numBlinks; i++) {
          $("#white-turn").animate({ 
            opacity: '0.0',
            height: '120px',
            width: '80px'
          }, 250);
          $("#white-turn").animate({ 
            opacity: '1.0',
            height: '180px',
            width: '120px'
          }, 250);
        }
      } else if (turnColor[0].toLowerCase() === "b") {
        for (var i = 0; i < numBlinks; i++) {
          $("#black-turn").animate({ 
            opacity: '0.0',
            height: '120px',
            width: '80px'
          }, 250);
          $("#black-turn").animate({ 
            opacity: '1.0',
            height: '180px',
            width: '120px'
          }, 250);
        }
      } else {
        console.error("Found a spurious turn color when flashing the turn indicator");
        return;
      }

    };

    var setWhiteTurn = function() {
      $('#white-turn').show();
      $('#black-turn').hide();
    };

    var setBlackTurn = function() {
      $('#white-turn').hide();
      $('#black-turn').show();
    };

  });

})();
