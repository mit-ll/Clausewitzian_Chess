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
 * Dashboard javascript
 */

(function() {
  WinJS.UI.processAll().then(function() {
    var socket = io();
    var games = {};
    var boards = {};

    //////////////////////////////
    // Socket.io handlers
    //////////////////////////////

    socket.emit("dashboardlogin");
    socket.on("dashboardlogin", function(msg) {
      createGamesList(msg.games);
    });

    socket.on("gameadd", function(msg) {
      if ($("#games").html() === "No active games") {
        $("#games").empty();
      }
      initGame(msg.gameId, msg.gameState);
    });

    socket.on("resign", function(msg) {
      let gameToRemove = document.getElementById(
        "game-board" + msg.gameId + "Wrapper"
      );
      if (gameToRemove !== null) {
        gameToRemove.parentElement.removeChild(gameToRemove);
      }

      if ($("#games").html() === "") {
        $("#games").append("No active games");
      }
    });

    socket.on("move", function(msg) {
      games[msg.gameId].move(msg.move);
      boards[msg.gameId].position(games[msg.gameId].fen());
    });

    socket.on("connect_error", function(error) {
      console.log("got connect_error:", error);
      window.location = "/dashboard.html";
    });

    //////////////////////////////
    // Chess Games
    //////////////////////////////

    var createGamesList = function(serverGames) {
      if (serverGames) {
        let count = 0;
        // Empty before rebuilding to account for default text
        $("#games").empty();

        Object.keys(serverGames).forEach(function(gameId) {
          initGame(gameId, serverGames[gameId]);
          count++;
        });

        if (count === 0) {
          $("#games").append("No active games");
        }
      } else {
        $("#games").append("No active games");
      }
    };

    var initGame = function(gameId, serverGame) {

      var cfg = {
        draggable: false,
        showNotation: false,
        orientation: "white",
        pieceTheme: "../img/chesspieces/wikipedia/{piece}.png",
        position: serverGame.board ? serverGame.board : "start"
      };

      // create the game parent div
      $("#games").append(
        $(
          '<div id="game-board' +
            gameId +
            'Wrapper"><div class="gameboardheader">' +
            serverGame.users.white +
            "(white)<br/> vs. <br/>" +
            serverGame.users.black +
            '(black)<div id="game-board' +
            gameId +
            '" class="gameboard"></div></div></div>'
        )
      );

      // create the game
      var game = serverGame.board ? new Chess(serverGame.board) : new Chess();
      games[gameId] = game;

      var board = new ChessBoard("game-board" + gameId, cfg);
      boards[gameId] = board;
      
    };

  });
})();