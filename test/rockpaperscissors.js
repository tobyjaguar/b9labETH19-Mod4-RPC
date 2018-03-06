Promise = require("bluebird");
var RockPaperScissors = artifacts.require("./RockPaperScissors.sol");
var BigNumber = require('bignumber.js');
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

web3.eth.expectedException = require("../utils/expectedException.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");

contract ('RockPaperScissors', function(accounts) {

  var owner = accounts[0];
  var player1 = accounts[1];
  var player2 = accounts[2];
  var blockExpiration = 5;

  beforeEach(function() {
    /*
    var block;
    block = web3.eth.blockNumber;
    console.log("Before: " + block);
    */
    return RockPaperScissors.new(blockExpiration, {from: owner})
    .then(function(instance) {
      contractInstance = instance;
    });
  });

  //test owner
  it("Should be owned by owner", function() {
    return contractInstance.owner.call({from: owner})
    .then(function(result) {
      assert.equal(result, owner, "Contract owner is not owned by owner.");
    });
  });

  //test deadline
  it("Should be able to set the deadline", function() {
    var currentBlock;
    return web3.eth.getBlockNumberPromise()
    .then(block => {
      currentBlock = block;
      return contractInstance.deadline.call({from: owner});
    })
    .then(function(result) {
      /*
      console.log(
        "current block: " + currentBlock + "\n" +
        "deadline calc: " + (blockExpiration + currentBlock) + "\n" +
        "deadline call: " + result
      );
      */
      //why does this work, should be 1 behind???
      assert.equal(result, (blockExpiration + currentBlock), "deadline did not return correctly.");
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
      p1HashedMove = result;
      return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "Player1 did not return true");
      assert.equal(result.logs[0].args.eGame, gameNumber, "Event did not return correct game");
      assert.equal(result.logs[0].args.ePlayer, player1, "Event did not return correct player");
      assert.equal(result.logs[0].args.eJackpot, sendAmount, "Event did not return correct jackpot");
      return contractInstance.games.call(gameNumber, {from: owner});
    })
    .then(result => {
      assert.equal(result[0], player1, "Player1's address did not return correctly");
      assert.equal(result[2], p1HashedMove, "Player1's move did not return correctly");
      assert.equal(result[4], true, "Player1's isP1Locked did not return true");
      assert.equal(result[6], sendAmount, "Jackpot did not return correctly");
    });
    //end test
  });

  describe("Add two players", function() {

    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = web3.toWei(1, "ether");

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player1 did not return true");
      });
    })

    it("Should add player 2", function() {

      return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount})
      .then(result => {
        assert.equal(result.receipt.status, true, "Player2 did not return true");
        assert.equal(result.logs[0].args.eGame, gameNumber, "Event did not return correct game");
        assert.equal(result.logs[0].args.ePlayer, player2, "Event did not return correct player");
        assert.equal(result.logs[0].args.eJackpot, sendAmount, "Event did not return correct jackpot");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        assert.equal(result[1], player2, "Player2's address did not return correctly");
        assert.equal(result[3], player2Move, "Player2's move did not return correctly");
        assert.equal(result[5], true, "Player2's isP2Locked did not return true");
        assert.equal(result[6], (sendAmount * 2), "Jackpot did not return correctly");
      });
    //end test
    });
    //end describe
  });

  describe("let player 2 win", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = web3.toWei(1, "ether");

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player1 did not return true");
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player1 did not return true");
      });
    })

    it("Should complete the game, Player 2 wins", function() {
      return contractInstance.settleGame(gameNumber, player1Move, p1Password)
      .then(result => {
        assert.equal(result.receipt.status, true, "settleGame did not return true");
        assert.equal(result.logs[0].args.eGame, gameNumber, "Event did not yield player 2 as the winner");
        assert.equal(result.logs[0].args.eWinner, player2, "Event did not yield player 2 as the winner");
        assert.equal(result.logs[0].args.eAmount, (sendAmount *2), "Event did not return correct amount");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        assert.equal(result[8], (sendAmount * 2), "p2Winnings did not return the correct amount");
      });
      //end test
    });
    //end describe
  });

  describe("check the withdraw", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = web3.toWei(1, "ether");

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player1 did not return true");
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player1 did not return true");
        return contractInstance.settleGame(gameNumber, player1Move, p1Password);
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "settleGame did not return true");
      });
    })

    it("Should let player 2 withdraw jackpot", function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return web3.eth.getBalancePromise(player2)
      .then(balance => {
        balanceBefore = balance;
      })
      return contractInstance.withdrawPlayer2(gameNumber)
      .then(txObj => {
        gasUsed = txObj.receipt.gasUsed;
        assert.equal(txObj.receipt.status, true, "Player 2 withdraw did not return true");
        assert.equal(txObj.logs[0].args.eGame, gameNumber, "Event did not return correct game");
        assert.equal(txObj.logs[0].args.eWinner, player2, "Event did not yield player 2 as the winner");
        assert.equal(txObj.logs[0].args.eAmount, (sendAmount *2), "Event did not return correct amount");
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee = gasUsed * gasPrice;
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        assert.equal(result[8], (sendAmount * 2), "p2Winnings did not return the correct amount");
        return web3.eth.getBalancePromise(player2);
      })
      .then(balanceNow => {
        assert.equal(balanceNow, balanceBefore.plus(sendAmount).minus(txFee), "Player 2 balance did not return correctly");
      });
      //end test
    });

    it("Should not allow player 1 to withdraw", function() {
      return web3.eth.expectedException(
        () => contractInstance.withdrawPlayer1(gameNumber),
        3000000);
      //end test
    });

    //end describe
  });

  describe("when players tie", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 1;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = web3.toWei(1, "ether");

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player1 did not return true");
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player2 did not return true");
        return contractInstance.settleGame(gameNumber, player1Move, p1Password);
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "settleGame did not return true");
      });
    })

    it("Should be able to withdraw player1's share", function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return web3.eth.getBalancePromise(player1)
      .then(balance => {
        balanceBefore = balance;
        return contractInstance.withdrawPlayer1(gameNumber, {from: player1});
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
        console.log(
          "Balance Now: " + balanceNow + "\n" +
          "Balance Before: " + balanceBefore + "\n" +
          "Balance eq: " + balanceBefore.plus(sendAmount).minus(txFee)
        );
        //why doesn't this equate without the toString(10)???
        assert.equal(balanceNow.toString(10), balanceBefore.plus(sendAmount).minus(txFee).toString(10), "Player1's balance did not return correctly");
      });
      //end test
    });

    it("Should be able to withdraw player2's share", function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return web3.eth.getBalancePromise(player2)
      .then(balance => {
        balanceBefore = balance;
        return contractInstance.withdrawPlayer2(gameNumber, {from: player2});
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
        //why doesn't this equate without the toString(10)???
        assert.equal(balanceNow.toString(10), balanceBefore.plus(sendAmount).minus(txFee).toString(10), "Player2's balance did not return correctly");
      });
      //end test
    });

    it("Should have reset the game", function() {

      return contractInstance.withdrawPlayer1(gameNumber, {from: player1})
      .then(result => {
        assert.equal(result.receipt.status, true, "withdrawPlayer1 did not return true");
        return contractInstance.withdrawPlayer2(gameNumber, {from: player2})
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "withdrawPlayer2 did not return true");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        console.log(
          "In the case of a tie, the jackpot is not reset during this game." + "\n" +
          "It will be reset when the first player starts another game with the same game number." + "\n" +
          "Jackpot: " + result[6]
        );
        assert.equal(result[0], 0, "Player 1 did not return 0");
        assert.equal(result[1], 0, "Player 2 did not return 0");
        assert.equal(result[2], 0, "Player 1's hashedMove did not return 0");
        assert.equal(result[3], 0, "Player 2's move did not return 0");
        assert.equal(result[4], false, "Player 1's lock did not return 0");
        assert.equal(result[5], false, "Player 2's lock did not return 0");
        assert.equal(result[7], 0, "Player 1's winnings did not return 0");
        assert.equal(result[8], 0, "Player 2's winnings did not return 0");
      });
      //end test
    });

    //end describe
  });


  describe("when player 1 forfeits", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = web3.toWei(1, "ether");

    beforeEach(function() {
      return contractInstance.helperHash.call(player1, player1Move, p1Password)
      .then(result => {
        p1HashedMove = result;
        return contractInstance.player1(gameNumber, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player1 did not return true");
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player2 did not return true");
        //Player 1 doesn't settle the game
        //advance block count
        return web3.eth.sendTransaction({from: owner, to: player1, value: 1});
      })
      .then(tx => {
        console.log(
          "Advance the block count past deadline of the game..." + "\n" +
          "Transaction #1: " + tx
        );
        return web3.eth.sendTransaction({from: owner, to: player1, value: 1});
      })
      .then(tx => {
        console.log("Transaction #2: " + tx);
        return web3.eth.sendTransaction({from: owner, to: player1, value: 1});
      })
      .then(tx => {
      console.log("Transaction #3: " + tx);
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
        assert.equal(txObj.logs[0].args.eGame, gameNumber, "Event did not return correct game");
        assert.equal(txObj.logs[0].args.eWinner, player2, "Event did not return correct receiver");
        assert.equal(txObj.logs[0].args.eAmount, (sendAmount * 2), "Event did not return correct amount");
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee = gasUsed * gasPrice;
        return web3.eth.getBalancePromise(player2);
      })
      .then(balanceNow => {
        assert.equal(balanceNow.toString(10), balanceBefore.plus(sendAmount*2).minus(txFee).toString(10), "Player2's balance did not return correctly");
      });
      //end test
    });

    //end describe
  });

//end contract
});
