Promise = require("bluebird");
var RockPaperScissors = artifacts.require("./RockPaperScissors.sol");
var BigNumber = require('bignumber.js');
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

web3.eth.expectedException = require("../utils/expectedException.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");

const situations = [
  {player1Move: 1, player2Move: 1},
  {player1Move: 1, player2Move: 2},
  {player1Move: 1, player2Move: 3},
  {player1Move: 2, player2Move: 1},
  {player1Move: 2, player2Move: 2},
  {player1Move: 2, player2Move: 3},
  {player1Move: 3, player2Move: 1},
  {player1Move: 3, player2Move: 2},
  {player1Move: 3, player2Move: 3}
];

contract ('RockPaperScissors', function(accounts) {

  var owner = accounts[0];
  var player1 = accounts[1];
  var player2 = accounts[2];
  var player3 = accounts[3];
  var blockExpiration = 20;

  beforeEach(function() {
    return RockPaperScissors.new(blockExpiration, {from: owner})
    .then(function(instance) {
      contractInstance = instance;
    });
  });

  //test owner
  it("Should be owned by owner", function() {
    return contractInstance.owner.call({from: owner})
    .then(function(result) {
      assert.strictEqual(result, owner, "Contract owner is not owned by owner.");
    });
  });
/*
  //test expiration
  it("Should be able to set the deadline", function() {
    var currentBlock;
    return web3.eth.getBlockNumberPromise()
    .then(block => {
      currentBlock = block;
      return contractInstance.expiration.call({from: owner});
    })
    .then(function(result) {
      assert.strictEqual(result.toString(10), blockExpiration.toString(10), "expiration did not return correctly.");
    });
  });

  it("Should be able to change expiration time", function() {
    var newExirpation = 1;
    return contractInstance.changeExpiration(newExirpation, {from: owner})
    .then(result => {
      assert.equal(result.receipt.status, true, "changeExpiration did not return true");
      assert.equal(result.logs[0].args.eBlockExpiration, newExirpation, "Expiration variable did not return correctly");
      return contractInstance.expiration.call({from: owner});
    })
    .then(result => {
      assert.strictEqual(result.toString(10), newExirpation.toString(10), "expiration did not return correctly");
    });
    //end test
  });

  it("Should be able to create a game", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var p1Password = "abc";
    var p1HashedMove;
    var currentBlock;
    var sendAmount = 1000;

    return contractInstance.helperHash.call(player1, player1Move, p1Password)
    .then(result => {
      p1HashedMove = result;
      return web3.eth.getBlockNumberPromise();
    })
    .then(blockNumber => {
      currentBlock = blockNumber;
      return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "createGame did not return true");
      assert.strictEqual(result.logs[0].args.eGame.toString(10), gameNumber.toString(10), "Event did not return correct game");
      assert.strictEqual(result.logs[0].args.ePlayer1, player1, "Event did not return correct player");
      assert.strictEqual(result.logs[0].args.ePlayer2, player2, "Event did not return correct player");
      assert.strictEqual(result.logs[0].args.eJackpot.toString(10), sendAmount.toString(10), "Event did not return correct jackpot");
      return contractInstance.games.call(gameNumber, {from: owner});
    })
    .then(result => {
      assert.strictEqual(result[0], player1, "Player1's address did not return correctly");
      assert.strictEqual(result[1], player2, "Player1's address did not return correctly");
      assert.strictEqual(result[2], p1HashedMove, "Player1's move did not return correctly");
      assert.strictEqual(result[4].toString(10), sendAmount.toString(10), "Jackpot did not return correctly");
      assert.strictEqual(result[5].toString(10), (currentBlock + blockExpiration + 1).toString(10), "deadline did not return correctly");
    });
    //end test
  });

  describe("Add player2 to the game", function() {

    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var p1Password = "abc";
    var p1HashedMove;
    var blockNumber;
    var sendAmount = 1000;

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      });
    })

    it("Should add player 2", function() {

      return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount})
      .then(result => {
        blockNumber = result.receipt.blockNumber;
        assert.equal(result.receipt.status, true, "Player2 did not return true");
        assert.strictEqual(result.logs[0].args.eGame.toString(10), gameNumber.toString(10), "Event did not return correct game");
        assert.strictEqual(result.logs[0].args.ePlayer2, player2, "Event did not return correct player");
        assert.strictEqual(result.logs[0].args.eJackpot.toString(10), sendAmount.toString(10), "Event did not return correct jackpot");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        assert.strictEqual(result[3].toString(10), player2Move.toString(10), "Player2's move did not return correctly");
        assert.strictEqual(result[5].toString(10), (blockNumber + blockExpiration).toString(10), "Game's deadline did not return correctly");
      });
    //end test
    });

    //end describe
  });

  describe("When Player 1 wins", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 3;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = 1000;

    it("Should complete the game, Player 1 wins", function() {
      return contractInstance.helperHash.call(player1, player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "createGame did not return true");
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "player2 did not return true");
        return contractInstance.settleGame(gameNumber, player1Move, p1Password, {from: player1});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "settleGame did not return true");
        assert.strictEqual(result.logs[0].args.eGame.toString(10), gameNumber.toString(10), "Event did not yield player 2 as the winner");
        assert.strictEqual(result.logs[0].args.eWinner, player1, "Event did not yield player 1 as the winner");
        assert.strictEqual(result.logs[0].args.eAmount.toString(10), (sendAmount *2).toString(10), "Event did not return correct amount");
        return contractInstance.winnings.call(player1, {from: owner});
      })
      .then(result => {
        assert.strictEqual(result.toString(10), (sendAmount * 2).toString(10), "player2's winnings did not return the correct amount");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        assert.strictEqual(result[0], "0x0000000000000000000000000000000000000000", "Player 1 did not return 0");
        assert.strictEqual(result[1], "0x0000000000000000000000000000000000000000", "Player 2 did not return 0");
        assert.strictEqual(result[2], "0x0000000000000000000000000000000000000000000000000000000000000000", "Player 1's hashedMove did not return 0");
        assert.strictEqual(result[3].toString(10), "0", "Player 1's move did not return 0");
      });
      //end test
    });

    //end describe
  });

  describe("When Player 2 wins", function() {
    var gameNumber = 123;
    var player1Move = 3;
    var player2Move = 1;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = 1000;

    it("Should complete the game, Player 2 wins", function() {
      return contractInstance.helperHash.call(player1, player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "createGame did not return true");
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "player2 did not return true");
        return contractInstance.settleGame(gameNumber, player1Move, p1Password, {from: player1});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "settleGame did not return true");
        assert.strictEqual(result.logs[0].args.eGame.toString(10), gameNumber.toString(10), "Event did not yield player 2 as the winner");
        assert.strictEqual(result.logs[0].args.eWinner, player2, "Event did not yield player 2 as the winner");
        assert.strictEqual(result.logs[0].args.eAmount.toString(10), (sendAmount *2).toString(10), "Event did not return correct amount");
        return contractInstance.winnings.call(player2, {from: owner});
      })
      .then(result => {
        assert.strictEqual(result.toString(10), (sendAmount * 2).toString(10), "player2's winnings did not return the correct amount");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        assert.strictEqual(result[0], "0x0000000000000000000000000000000000000000", "Player 1 did not return 0");
        assert.strictEqual(result[1], "0x0000000000000000000000000000000000000000", "Player 2 did not return 0");
        assert.strictEqual(result[2], "0x0000000000000000000000000000000000000000000000000000000000000000", "Player 1's hashedMove did not return 0");
        assert.strictEqual(result[3].toString(10), "0", "Player 2's move did not return 0");
      });
      //end test
    });

    //end describe
  });

  describe("All move combinations", function() {
    var gameNumber = 123;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = 1000;

    situations
    .forEach(situation => {

    it("Should complete the game with Player 1 move: " + situation.player1Move +
        " and Player 2 move: " + situation.player2Move, function() {
      return contractInstance.helperHash.call(player1, situation.player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "createGame did not return true");
        return contractInstance.player2(gameNumber, situation.player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "player2 did not return true");
        return contractInstance.settleGame(gameNumber, situation.player1Move, p1Password, {from: player1});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "settleGame did not return true");
      });
      //end test
    });
    //end situations
  });
    //end describe
  });

  describe("Player 1 wins and withdraws", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = 1000;

    const gamesP1Wins = [
      {player1Move: 1, player2Move: 3},
      {player1Move: 2, player2Move: 1},
      {player1Move: 3, player2Move: 2}
    ];

    gamesP1Wins
    .forEach(game => {

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, game.player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "createGame did not return true");
        return contractInstance.player2(gameNumber, game.player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player2 did not return true");
        return contractInstance.settleGame(gameNumber, game.player1Move, p1Password, {from: player1});
      });
    })

    it("Should let player 1 withdraw the jackpot, where Player 1's move is: " + game.player1Move +
        " and Player 2's move is: " + game.player2Move, function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return web3.eth.getBalancePromise(player1)
      .then(balance => {
        balanceBefore = balance;
      })
      return contractInstance.withdraw({from: palyer1})
      .then(txObj => {
        gasUsed = txObj.receipt.gasUsed;
        assert.equal(txObj.receipt.status, true, "Player 1 withdraw did not return true");
        assert.strictEqual(txObj.logs[0].args.eWinner, player1, "Event did not yield player 1 as the winner");
        assert.strictEqual(txObj.logs[0].args.eAmount.toString(10), (sendAmount *2), "Event did not return correct amount");
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee = gasUsed * gasPrice;
        return web3.eth.getBalancePromise(player1);
      })
      .then(balanceNow => {
        assert.strictEqual(balanceNow, balanceBefore.plus(sendAmount).minus(txFee), "Player 1 balance did not return correctly");
      });
      //end test
    });

    it("Should not allow Player 2 to withdraw when Player 1 wins", function() {
      return web3.eth.expectedException(
        () => contractInstance.withdraw({from: player2}),
        3000000);
      //end test
    });
    //end situations
  });
    //end describe
  });

  describe("Player 2 wins and withdraws", function() {
    var gameNumber = 123;
    var player1Move = 2;
    var player2Move = 1;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = 1000;

    const gamesP2Wins = [
      {player2Move: 1, player1Move: 3},
      {player2Move: 2, player1Move: 1},
      {player2Move: 3, player1Move: 2}
    ];

    gamesP2Wins
    .forEach(game => {

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, game.player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "createGame did not return true");
        return contractInstance.player2(gameNumber, game.player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player2 did not return true");
        return contractInstance.settleGame(gameNumber, game.player1Move, p1Password, {from: player1});
      });
    })

    it("Should let player 2 withdraw the jackpot, where Player 2's move is: " + game.player2Move +
        " and Player 1's move is: " + game.player1Move, function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return web3.eth.getBalancePromise(player2)
      .then(balance => {
        balanceBefore = balance;
      })
      return contractInstance.withdraw({from: palyer2})
      .then(txObj => {
        gasUsed = txObj.receipt.gasUsed;
        assert.equal(txObj.receipt.status, true, "Player 2 withdraw did not return true");
        assert.strictEqual(txObj.logs[0].args.eWinner, player2, "Event did not yield player 2 as the winner");
        assert.strictEqual(txObj.logs[0].args.eAmount.toString(10), (sendAmount *2), "Event did not return correct amount");
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee = gasUsed * gasPrice;
        return web3.eth.getBalancePromise(player2);
      })
      .then(balanceNow => {
        assert.strictEqual(balanceNow, balanceBefore.plus(sendAmount).minus(txFee), "Player 2 balance did not return correctly");
      });
      //end test
    });

    it("Should not allow Player 1 to withdraw when Player 2 wins", function() {
      return web3.eth.expectedException(
        () => contractInstance.withdraw({from: player1}),
        3000000);
      //end test
    });
    //end situations
  });
    //end describe
  });

  describe("When players tie", function() {
    var gameNumber = 123;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = 1000;

    situations
    .filter(situation => {
      situation.player1Move == situation.player2Move
    })
    .forEach(situation => {

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, situation.player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        return contractInstance.player2(gameNumber, situation.player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        return contractInstance.settleGame(gameNumber, situation.player1Move, p1Password, {from: player1});
      });
    })

    it("Should be able to withdraw player1's share when player's both play: " + situation.player1Move, function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return contractInstance.winnings.call(player1, {from: owner})
      .then(result => {
        assert.strictEqual(result.toString(10), sendAmount, "Player1's winnings did not return correctly");
        return web3.eth.getBalancePromise(player1);
      })
      .then(balance => {
        balanceBefore = balance;
        return contractInstance.withdraw({from: player1});
      })
      .then(txObj => {
        assert.equal(txObj.receipt.status, true, "withdrawPlayer1 did not return true");
        gasUsed = txObj.receipt.gasUsed;
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee = gasUsed * gasPrice;
        return web3.eth.getBalancePromise(player1);
      })
      .then(balanceNow => {
        assert.strictEqual(balanceNow.toString(10), balanceBefore.plus(sendAmount).minus(txFee).toString(10), "Player1's balance did not return correctly");
      });
      //end test
    });

    it("Should be able to withdraw player2's share when player's both play: " + situation.player1Move, function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return contractInstance.winnings.call(player2, {from: owner})
      .then(result => {
        assert.strictEqual(result.toString(10), sendAmount, "Player2's winnings did not return correctly");
        return web3.eth.getBalancePromise(player2);
      })
      .then(balance => {
        balanceBefore = balance;
        return contractInstance.withdraw({from: player2});
      })
      .then(txObj => {
        assert.equal(txObj.receipt.status, true, "withdrawPlayer2 did not return true");
        gasUsed = txObj.receipt.gasUsed;
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee = gasUsed * gasPrice;
        return web3.eth.getBalancePromise(player2);
      })
      .then(balanceNow => {
        assert.strictEqual(balanceNow.toString(10), balanceBefore.plus(sendAmount).minus(txFee).toString(10), "Player2's balance did not return correctly");
      });
      //end test
    });
    //end situations
  });
    //end describe
  });

  describe("Multiple game play", function() {
    const gamePlay = [
      {gameID: 1, player1Move: 1, player2Move: 2}, //player1 wins
      {gameID: 2, player1Move: 2, player2Move: 2}, //players tie
      {gameID: 3, player1Move: 3, player2Move: 2}, //player1 wins
      {gameID: 4, player1Move: 1, player2Move: 3}, //player2 wins
      {gameID: 5, player1Move: 2, player2Move: 1}, //player1 wins
    ];
    var game1 = 1;
    var game2 = 2;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = 1000;
    var balanceBefore;
    var balanceNow;
    var gasUsed = 0;
    var gasPrice = 0;
    var txFee = 0;

    it("Should not leak winnings over multiple games" , function() {
      return web3.eth.getBalancePromise(player1)
      .then(balance => {
        balanceBefore = balance;
        return contractInstance.helperHash.call(player1, game.player1Move, p1Password);
      })
      .then(hashedResult => {
        console.log("helper");
        p1HashedMove = hashedResult;
        return contractInstance.createGame(game.gameID, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(txObj => {
        console.log("create");
        gasUsed = txObj.receipt.gasUsed;
        assert.equal(txObj.receipt.status, true, "createGame did not return true");
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        console.log("get transacrtion");
        gasPrice = tx.gasPrice;
        txFee += gasUsed * gasPrice;
        return contractInstance.player2(game.gameID, game.player2Move, {from: player2, value: sendAmount});
      })
      .then(txObj => {
        console.log("player2");
        assert.equal(txObj.receipt.status, true, "player2 function did not return true");
        return contractInstance.settleGame(game.gameID, game.player1Move, p1Password, {from: player1});
      })
      .then(txObj => {
        console.log("settle");
        gasUsed = txObj.receipt.gasUsed;
        assert.equal(txObj.receipt.status, true, "settleGame did not return true");
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee += gasUsed * gasPrice;
      })
      .then(() => {
        return contractInstance.withdraw({from: player1});
      })
      .then(txObj => {
        gasUsed = txObj.receipt.gasused;
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee += gasUsed * gasPrice;
        return web3.eth.getBalancePromise(player1);
      })
      .then(balanceNow => {
        assert.strictEqual(balanceNow.toString(10), balanceBefore.plus(amount * 6).minus(txFee), "Player1's balance did not return correctly");
      });
      //end test
    });

    //end describe
  });
*/

  describe("play multiple games", function() {
    const gamePlay = [
      {gameID: 1, player1Move: 1, player2Move: 2}, //player1 wins
      {gameID: 2, player1Move: 2, player2Move: 2}, //players tie
      {gameID: 3, player1Move: 3, player2Move: 2}, //player1 wins
      {gameID: 4, player1Move: 1, player2Move: 3}, //player2 wins
      {gameID: 5, player1Move: 2, player2Move: 1}, //player1 wins
    ];
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = 1000;
    var balanceBefore;
    var balanceNow;
    var gasUsed = 0;
    var gasPrice = 0;
    var txFee = 0;

    before(function() {
      return web3.eth.getBalancePromise(player1)
      .then(balance => {
        balanceBefore = balance;
      });
    })

    it("Should run multiple games", function() {
        gamePlay
        .forEach(game => {
          return contractInstance.helperHash.call(player1, game.player1Move, p1Password)
          .then(hashedResult => {
            //console.log("hashed: " + hashedResult);
            p1HashedMove = hashedResult;
            return contractInstance.createGame(game.gameID, player2, p1HashedMove, {from: player1, value: sendAmount});
          })
          .then(txObj => {
            gasUsed = txObj.receipt.gasUsed;
            assert.equal(txObj.receipt.status, true, "settleGame did not return true");
            return web3.eth.getTransactionPromise(txObj.tx);
          })
          .then(tx => {
            gasPrice = tx.gasPrice;
            txFee += gasUsed * gasPrice;
            return contractInstance.player2(game.gameID, game.player2Move, {from: player2, value: sendAmount});
          })
          .then(txObj => {
            assert.equal(txObj.receipt.status, true, "player2 did not return true");
            return contractInstance.games(game.gameID, {from: owner});
            //return contractInstance.settleGame(game.gameID, game.player1Move, p1Password, {from: player1});
          })
          .then(result => {
            console.log(
              "game:" + game.gameID + "\n" +
              "p1Move:" + result[2] + "\n" +
              "p2Move: " + result[3]
            );
          });
          //end for
        });
      //end test
    });
/*
    it("Should run multiple games", function() {
        gamePlay
        .forEach(game => {
          return contractInstance.helperHash.call(player1, game.player1Move, p1Password)
          .then(hashedResult => {
            p1HashedMove = hashedResult;
            return contractInstance.createGame(game.gameID, player2, p1HashedMove, {from: player1, value: sendAmount});
          })
          .then(txObj => {
            gasUsed = txObj.receipt.gasUsed;
            assert.equal(txObj.receipt.status, true, "settleGame did not return true");
            return web3.eth.getTransactionPromise(txObj.tx);
          })
          .then(tx => {
            gasPrice = tx.gasPrice;
            txFee += gasUsed * gasPrice;
            return contractInstance.player2(game.gameID, game.player2Move, {from: player2, value: sendAmount});
          })
          .then(txObj => {
            assert.equal(txObj.receipt.status, true, "player2 did not return true");
            return contractInstance.settleGame(game.gameID, game.player1Move, p1Password, {from: player1});
          })
          .then(txObj => {
            gasUsed = txObj.receipt.gasUsed;
            assert.equal(txObj.receipt.status, true, "settleGame did not return true");
            return web3.eth.getTransactionPromise(txObj.tx);
          })
          .then(tx => {
            gasPrice = tx.gasPrice;
            txFee += gasUsed * gasPrice;
          });
          //end for
        });
      //end test
    });
*/
    it("Should withdraw player1's winnings", function() {
      return web3.eth.getBalancePromise(player1)
      .then(balanceNow => {
        console.log(
          "balance before: " + balanceBefore + "\n" +
          "balance now: " + balanceNow + "\n" +
          "delta: " + balanceBefore.plus(sendAmount*6).minus(txFee) + "\n" +
          "txFee: " + txFee
        );
        //assert.strictEqual(result[3].toNumber(), 1, "game 5 did not return the correct move for p2");
      });
        //end test
    });

    //end describe
  });
/*
  describe("When player 1 forfeits", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var p1Password = "abc";
    var p1HashedMove;
    var newExirpation = 1;
    var sendAmount = 1000;

    beforeEach(function() {
      return contractInstance.changeExpiration(newExirpation, {from: owner})
      .then(() => {
        return contractInstance.helperHash.call(player1, player1Move, p1Password);
      })
      .then(result => {
        p1HashedMove = result;
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      });
    })

    it("Should allow for player2 to withdraw via forfeit", function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return web3.eth.getBalancePromise(player2)
      .then(balance => {
        balanceBefore = balance;
        return contractInstance.forfeit(gameNumber, {from: player2});
      })
      .then(txObj => {
        gasUsed = txObj.receipt.gasUsed;
        assert.equal(txObj.receipt.status, true, "forfeit did not return true");
        return contractInstance.withdraw({from: player2});
      })
      .then(txObj => {
        gasUsed += txObj.receipt.gasUsed;
        assert.strictEqual(txObj.logs[0].args.eWinner, player2, "Event did not return correct receiver");
        assert.strictEqual(txObj.logs[0].args.eAmount.toString(10), (sendAmount * 2).toString(10), "Event did not return correct amount");
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee = gasUsed * gasPrice;
        return web3.eth.getBalancePromise(player2);
      })
      .then(balanceNow => {
        assert.strictEqual(balanceNow.toString(10), balanceBefore.plus(sendAmount*2).minus(txFee).toString(10), "Player2's balance did not return correctly");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        assert.equal(result[0], 0, "Player 1 did not return 0");
        assert.equal(result[1], 0, "Player 2 did not return 0");
        assert.equal(result[2], 0, "Player 1's hashedMove did not return 0");
        assert.equal(result[3], 0, "Player 2's move did not return 0");
      });
      //end test
    });

    //end describe
  });

  describe("when player 2 forfeits", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = web3.toWei(1, "ether");

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        //Player 2 doesn't settle the game
        //advance block count
        return web3.eth.sendTransaction({from: owner, to: player2, value: 1});
      })
      .then(tx => {
        console.log(
          "Advance the block count past deadline of the game..." + "\n" +
          "Transaction #1: " + tx
        );
        return web3.eth.sendTransaction({from: owner, to: player2, value: 1});
      })
      .then(tx => {
        console.log("Transaction #2: " + tx);
        return web3.eth.sendTransaction({from: owner, to: player2, value: 1});
      })
      .then(tx => {
        console.log("Transaction #3: " + tx);
        return web3.eth.sendTransaction({from: owner, to: player2, value: 1});
      })
      .then(tx => {
        console.log("Transaction #4: " + tx);
    });
  })

    it("Should allow for player1 to withdraw via forfeit", function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;
      var deadline;

      return web3.eth.getBalancePromise(player1)
      .then(balance => {
        balanceBefore = balance;
        return contractInstance.forfeit(gameNumber, {from: player1});
      })
      .then(txObj =>{
        gasUsed = txObj.receipt.gasUsed;
        assert.equal(txObj.receipt.status, true, "forfeit did not return true");
        return contractInstance.withdraw({from: player1});
      })
      .then(txObj => {
        gasUsed += txObj.receipt.gasUsed;
        assert.strictEqual(txObj.logs[0].args.eWinner, player1, "Event did not return correct receiver");
        assert.strictEqual(txObj.logs[0].args.eAmount.toString(10), sendAmount.toString(10), "Event did not return correct amount");
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee = gasUsed * gasPrice;
        return web3.eth.getBalancePromise(player1);
      })
      .then(balanceNow => {
        assert.strictEqual(balanceNow.toString(10), balanceBefore.plus(sendAmount).minus(txFee).toString(10), "Player1's balance did not return correctly");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        assert.strictEqual(result[0], "0x0000000000000000000000000000000000000000", "Player 1 did not return 0");
        assert.strictEqual(result[1], "0x0000000000000000000000000000000000000000", "Player 2 did not return 0");
        assert.strictEqual(result[2], "0x0000000000000000000000000000000000000000000000000000000000000000", "Player 1's hashedMove did not return 0");
        assert.strictEqual(result[3].toString(10), "0", "Player 2's move did not return 0");
      });
      //end test
    });

    //end describe
  });
*/
//end contract
});
