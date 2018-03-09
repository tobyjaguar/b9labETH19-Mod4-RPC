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

  //test expiration
  it("Should be able to set the deadline", function() {
    var currentBlock;
    return web3.eth.getBlockNumberPromise()
    .then(block => {
      currentBlock = block;
      return contractInstance.expiration.call({from: owner});
    })
    .then(function(result) {
      assert.strictEqual(result.valueOf(), blockExpiration.toString(10), "expiration did not return correctly.");
    });
  });

  it("Should be able to create a game", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var p1Password = "abc";
    var p1HashedMove;
    var currentBlock;
    var sendAmount = web3.toWei(1, "ether");

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
      assert.strictEqual(result.logs[0].args.eGame.valueOf(), gameNumber.toString(10), "Event did not return correct game");
      assert.strictEqual(result.logs[0].args.ePlayer1, player1, "Event did not return correct player");
      assert.strictEqual(result.logs[0].args.ePlayer2, player2, "Event did not return correct player");
      assert.strictEqual(result.logs[0].args.eJackpot.valueOf(), sendAmount.toString(10), "Event did not return correct jackpot");
      return contractInstance.games.call(gameNumber, {from: owner});
    })
    .then(result => {
      //console.log(JSON.stringify(result[5]));
      assert.strictEqual(result[0], player1, "Player1's address did not return correctly");
      assert.strictEqual(result[1], player2, "Player1's address did not return correctly");
      assert.strictEqual(result[2], p1HashedMove, "Player1's move did not return correctly");
      assert.strictEqual(result[4].valueOf(), sendAmount.toString(10), "Jackpot did not return correctly");
      assert.strictEqual(result[5].valueOf(), (currentBlock + blockExpiration + 1).toString(10), "deadline did not return correctly");
    });
    //end test
  });

  describe("Add player2 to the game", function() {

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
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      });
    })

    it("Should add player 2", function() {

      return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount})
      .then(result => {
        assert.equal(result.receipt.status, true, "Player2 did not return true");
        assert.strictEqual(result.logs[0].args.eGame.valueOf(), gameNumber.toString(10), "Event did not return correct game");
        assert.strictEqual(result.logs[0].args.ePlayer2, player2, "Event did not return correct player");
        assert.strictEqual(result.logs[0].args.eJackpot.valueOf(), sendAmount.toString(10), "Event did not return correct jackpot");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
      .then(result => {
        assert.strictEqual(result[3].valueOf(), player2Move.toString(10), "Player2's move did not return correctly");
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
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "createGame did not return true");
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      });
    })

    it("Should complete the game, Player 2 wins", function() {
      return contractInstance.settleGame(gameNumber, player1Move, p1Password, {from: player1})
      .then(result => {
        assert.equal(result.receipt.status, true, "settleGame did not return true");
        assert.strictEqual(result.logs[0].args.eGame.valueOf(), gameNumber.toString(10), "Event did not yield player 2 as the winner");
        assert.strictEqual(result.logs[0].args.eWinner, player2, "Event did not yield player 2 as the winner");
        assert.strictEqual(result.logs[0].args.eAmount.valueOf(), (sendAmount *2).toString(10), "Event did not return correct amount");
        return contractInstance.winnings.call(player2, {from: owner});
      })
      .then(result => {
        assert.strictEqual(result.valueOf(), (sendAmount * 2).toString(10), "player2's winnings did not return the correct amount");
        return contractInstance.games.call(gameNumber, {from: owner});
      })
        .then(result => {
          console.log(
            "In the case of a tie, the jackpot is not reset during this game." + "\n" +
            "It will be reset when the first player starts another game with the same game number." + "\n" +
            "Jackpot: " + result[4]
          );
          assert.strictEqual(result[0], "0x0000000000000000000000000000000000000000", "Player 1 did not return 0");
          assert.strictEqual(result[1], "0x0000000000000000000000000000000000000000", "Player 2 did not return 0");
          assert.strictEqual(result[2], "0x0000000000000000000000000000000000000000000000000000000000000000", "Player 1's hashedMove did not return 0");
          assert.strictEqual(result[3].valueOf(), "0", "Player 2's move did not return 0");
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
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "createGame did not return true");
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        assert.equal(result.receipt.status, true, "Player2 did not return true");
        return contractInstance.settleGame(gameNumber, player1Move, p1Password, {from: player1});
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
      return contractInstance.withdraw({from: palyer2})
      .then(txObj => {
        gasUsed = txObj.receipt.gasUsed;
        assert.equal(txObj.receipt.status, true, "Player 2 withdraw did not return true");
        assert.strictEqual(txObj.logs[0].args.eWinner, player2, "Event did not yield player 2 as the winner");
        assert.strictEqual(txObj.logs[0].args.eAmount.valueOf(), (sendAmount *2), "Event did not return correct amount");
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

    it("Should not allow player 1 to withdraw", function() {
      return web3.eth.expectedException(
        () => contractInstance.withdraw({from: player1}),
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
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
        return contractInstance.settleGame(gameNumber, player1Move, p1Password, {from: player1});
      });
    })

    it("Should be able to withdraw player1's share", function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return contractInstance.winnings.call(player1, {from: owner})
      .then(result => {
        assert.strictEqual(result.valueOf(), sendAmount, "Player1's winnings did not return correctly");
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
        /*
        console.log(
          "Balance Now: " + balanceNow + "\n" +
          "Balance Before: " + balanceBefore + "\n" +
          "Balance eq: " + balanceBefore.plus(sendAmount).minus(txFee)
        );
        */
        assert.strictEqual(balanceNow.toString(10), balanceBefore.plus(sendAmount).minus(txFee).toString(10), "Player1's balance did not return correctly");
      });
      //end test
    });

    it("Should be able to withdraw player2's share", function() {
      var hash;
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee;
      var balanceBefore;

      return contractInstance.winnings.call(player2, {from: owner})
      .then(result => {
        assert.strictEqual(result.valueOf(), sendAmount, "Player2's winnings did not return correctly");
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
        return contractInstance.createGame(gameNumber, player2, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(result => {
        return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
      })
      .then(result => {
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
        assert.equal(txObj.receipt.status, true, "forfeit did not return true");
        return contractInstance.withdraw({from: player2});
      })
      .then(txObj => {
        gasUsed += txObj.receipt.gasUsed;
        assert.strictEqual(txObj.logs[0].args.eWinner, player2, "Event did not return correct receiver");
        assert.strictEqual(txObj.logs[0].args.eAmount.valueOf(), (sendAmount * 2).toString(10), "Event did not return correct amount");
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
        assert.strictEqual(txObj.logs[0].args.eAmount.valueOf(), sendAmount, "Event did not return correct amount");
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
        assert.strictEqual(result[3].valueOf(), "0", "Player 2's move did not return 0");
      });
      //end test
    });

    //end describe
  });

//end contract
});
