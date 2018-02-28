var RockPaperScissors = artifacts.require("./RockPaperScissors.sol");

contract ('RockPaperScissors', function(accounts) {

  var owner = accounts[0];
  var player1 = accounts[1];
  var player2 = accounts[2];

  beforeEach(function() {
    return RockPaperScissors.new({from: owner})
    .then(function(instance) {
      contractInstance = instance;
    });
  });

  //test owner
  it("Should be owner by owner", function() {
    return contractInstance.owner({from: owner})
    .then(function(_result) {
      assert.equal(_result, owner, "Contract owner is not owned by owner.");
    });
  });

  it("Should add player 1", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = web3.toWei(1, "ether");

    return contractInstance.helperHash.call(player1, player1Move, p1Password)
    .then(result => {
      p1HashedMove = result.valueOf();
      return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "Player1 did not return true");
      return contractInstance.games.call(gameNumber, {from: owner});
    })
    .then(result => {
      //console.log(JSON.stringify("Result: " + result, null, 4));
      assert.equal(result[0], player1, "Player1's address did not return correctly");
      assert.equal(result[2].valueOf(), p1HashedMove, "Player1's move did not return correctly");
      assert.equal(result[5], sendAmount, "Jackpot did not return correctly");
      return contractInstance.getBalance.call({from: owner});
    })
    .then(result => {
      assert.equal(result.valueOf(), sendAmount, "contract balance did not return correctly");
    });
    //end test
  });

  it("Should add player 2", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var p1Password = "abc";
    var p2Password = "def";
    var p1HashedMove;
    var p2HashedMove;
    var sendAmount = web3.toWei(1, "ether");

    return contractInstance.helperHash.call(player1, player1Move, p1Password)
    .then(result => {
      p1HashedMove = result.valueOf();
      return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "Player1 did not return true");
      return contractInstance.helperHash.call(player2, player2Move, p2Password);
    })
    .then(result => {
      p2HashedMove = result.valueOf();
      return contractInstance.player2(gameNumber, p2HashedMove, {from: player2, value: sendAmount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "Player2 did not return true");
      return contractInstance.games.call(gameNumber, {from: owner});
    })
    .then(result => {
      assert.equal(result[1], player2, "Player2's address did not return correctly");
      assert.equal(result[3].valueOf(), p2HashedMove, "Player2's move did not return correctly");
      assert.equal(result[5], sendAmount * 2, "Jackpot did not return correctly");
      return contractInstance.getBalance.call({from: owner});
    })
    .then(result => {
      assert.equal(result.valueOf(), (sendAmount * 2), "contract balance did not return correctly");
    });
    //end test
  });

  it("Should complete game, Player 2 wins", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var p1Password = "abc";
    var p2Password = "def";
    var p1HashedMove;
    var p2HashedMove;
    var sendAmount = web3.toWei(1, "ether");

    return contractInstance.helperHash.call(player1, player1Move, p1Password)
    .then(result => {
      p1HashedMove = result.valueOf();
      return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "Player1 did not return true");
      return contractInstance.helperHash.call(player2, player2Move, p2Password);
    })
    .then(result => {
      p2HashedMove = result.valueOf();
      return contractInstance.player2(gameNumber, p2HashedMove, {from: player2, value: sendAmount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "Player2 did not return true");
      return contractInstance.settleGame(gameNumber, player1Move, player2Move, p1Password, p2Password);
    })
    .then(result => {
      //console.log("Result from end game function: " + result.logs[0].args.win
      assert.equal(result.receipt.status, true, "settleGame did not return true");
      assert.equal(result.logs[0].args.eWinner, player2, "Game did not yield player 2 as the winner");
      assert.equal(result.logs[0].args.eAmount, (sendAmount *2), "Game did not yield player 2 as the winner");
      return contractInstance.games.call(gameNumber, {from: owner});
    })
    .then(result => {
      assert.equal(result[0], 0, "Player1's address did not return correctly");
      assert.equal(result[1], 0, "Player2's address did not return correctly");
      assert.equal(result[2].valueOf(), 0, "Player1's move did not return correctly");
      assert.equal(result[3].valueOf(), 0, "Player2's move did not return correctly");
      assert.equal(result[4].valueOf(), false, "isLocked did not return false");
      assert.equal(result[5], 0, "Jackpot did not return correctly");

      return contractInstance.getBalance.call({from: owner});
      })
      .then(balanceNow => {
         assert.equal(balanceNow.valueOf(), 0, "Balance did not resolve correctly");
      });
      //end test
    });

      it("Should complete game, with a tie", function() {
        var gameNumber = 123;
        var player1Move = 1;
        var player2Move = 1;
        var p1Password = "abc";
        var p2Password = "def";
        var p1HashedMove;
        var p2HashedMove;
        var sendAmount = web3.toWei(1, "ether");


        return contractInstance.helperHash.call(player1, player1Move, p1Password)
        .then(result => {
          p1HashedMove = result.valueOf();
          return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
        })
        .then(result => {
          assert.equal(result.receipt.status, true, "Player1 did not return true");
          return contractInstance.helperHash.call(player2, player2Move, p2Password);
        })
        .then(result => {
          p2HashedMove = result.valueOf();
          return contractInstance.player2(gameNumber, p2HashedMove, {from: player2, value: sendAmount});
        })
        .then(result => {
          assert.equal(result.receipt.status, true, "Player2 did not return true");
          return contractInstance.settleGame(gameNumber, player1Move, player2Move, p1Password, p2Password);
        })
        .then(result => {
          assert.equal(result.receipt.status, true, "settleGame did not return true");
          assert.equal(result.logs[0].args.eWinner, 0, "event did not return a tie");
          assert.equal(result.logs[0].args.eAmount, sendAmount, "event did not return correct amount");
          return contractInstance.games.call(gameNumber, {from: owner});
        })
        .then(result => {
          assert.equal(result[0], 0, "Player1's address did not return correctly");
          assert.equal(result[1], 0, "Player2's address did not return correctly");
          assert.equal(result[2].valueOf(), 0, "Player1's move did not return correctly");
          assert.equal(result[3].valueOf(), 0, "Player2's move did not return correctly");
          assert.equal(result[4].valueOf(), false, "isLocked did not return false");
          assert.equal(result[5], 0, "Jackpot did not return correctly");

          return contractInstance.getBalance.call({from: owner});
        })
        .then(balanceNow => {
             assert.equal(balanceNow, 0, "Balance did not resolve correctly");
          });
          //end test
        });

//end contract
});
