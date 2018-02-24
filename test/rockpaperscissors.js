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
    var sendAmount = web3.toWei(1, "ether");
    return contractInstance.player1(gameNumber, player1Move, {from: player1, value: sendAmount})
    .then(result => {
      assert.equal(result.receipt.status, true, "Player1 did not return true");
      return contractInstance.games.call(gameNumber, {from: owner})
      .then(result => {
        //console.log(JSON.stringify("Result: " + result, null, 4));
        assert.equal(result[0], player1, "Player1's address did not return correctly");
        assert.equal(result[2].valueOf(), player1Move - 1, "Player1's move did not return correctly");
        assert.equal(result[5], sendAmount, "Jackpot did not return correctly");
      });
    });
  });

  it("Should add player 2", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var sendAmount = web3.toWei(1, "ether");
    return contractInstance.player1(gameNumber, player1Move, {from: player1, value: sendAmount})
    .then(result => {
      assert.equal(result.receipt.status, true, "Player1 did not return true");
      return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "Player2 did not return true");
      return contractInstance.games.call(gameNumber, {from: owner});
    })
    .then(result => {
      assert.equal(result[1], player2, "Player2's address did not return correctly");
      assert.equal(result[3].valueOf(), player2Move - 1, "Player2's move did not return correctly");
      assert.equal(result[5], sendAmount * 2, "Jackpot did not return correctly");
    });
  });

  it("Should complete game, Player 2 wins", function() {
    var gameNumber = 123;
    var player1Move = 1;
    var player2Move = 2;
    var sendAmount = web3.toWei(1, "ether");
    var player2BalanceBefore;
    var player2BalanceNow;
    var gas;

    return new Promise((resolve, reject) => {
      web3.eth.getBalance(player2, (err, balance) => {
        if (err) reject(err)
        else resolve(balance)
      });
    })
    .then(balance => {
      //console.log("Balance: " + balance);
      player2BalanceBefore = balance;
      return contractInstance.player1(gameNumber, player1Move, {from: player1, value: sendAmount})
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "Player1 did not return true");
      return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
    })
    .then(result => {
      assert.equal(result.receipt.status, true, "Player2 did not return true");
      return contractInstance.endGame(gameNumber);
    })
    .then(result => {
      //console.log("Result from end game function: " + result.logs[0].args.winner);
      gas = result.receipt.gasUsed;
      assert.equal(result.receipt.status, true, "endGame did not return true");
      assert.equal(result.logs[0].args.winner, player2, "Game did not yield player 2 as the winner");
      return contractInstance.games.call(gameNumber, {from: owner});
    })
    .then(result => {
      assert.equal(result[0], 0, "Player1's address did not return correctly");
      assert.equal(result[1], 0, "Player2's address did not return correctly");
      assert.equal(result[2].valueOf(), 0, "Player1's move did not return correctly");
      assert.equal(result[3].valueOf(), 0, "Player2's move did not return correctly");
      assert.equal(result[4].valueOf(), false, "isLocked did not return false");
      assert.equal(result[5], 0, "Jackpot did not return correctly");

      return new Promise ((resolve, reject) => {
        web3.eth.getBalance(player2, (err, balance) => {
          if (err) reject(err)
          else resolve(balance)
        });
      });
      })
      .then(balance => {
        var balanceBeforeFormat;
        var balanceNowFormat;
         player2BalanceNow = balance;
         balanceBeforeFormat = parseInt(web3.fromWei((parseInt(player2BalanceBefore,10) + parseInt(sendAmount,10))));
         balanceNowFormat = parseInt(web3.fromWei(parseInt(player2BalanceNow.valueOf(),10)));
         //console.log("Balance Before: " + (parseInt(player2BalanceBefore) + parseInt(sendAmount)) + "\n" + "Balance Now: " + player2BalanceNow);
         assert.equal(balanceNowFormat, balanceBeforeFormat, "Balance did not resolve correctly");
      });
      //end test
    });

      it("Should complete game, with a tie", function() {
        var gameNumber = 123;
        var player1Move = 1;
        var player2Move = 1;
        var sendAmount = web3.toWei(1, "ether");
        var player1BalanceBefore;
        var player1BalanceNow;
        var player2BalanceBefore;
        var player2BalanceNow;

        return new Promise((resolve, reject) => {
          web3.eth.getBalance(player2, (err, balance) => {
            if (err) reject(err)
            else resolve(balance)
          });
        })
        .then(balance => {
          //console.log("Balance: " + balance);
          player2BalanceBefore = balance;
          return contractInstance.player1(gameNumber, player1Move, {from: player1, value: sendAmount})
        })
        .then(result => {
          assert.equal(result.receipt.status, true, "Player1 did not return true");
          return contractInstance.player2(gameNumber, player2Move, {from: player2, value: sendAmount});
        })
        .then(result => {
          assert.equal(result.receipt.status, true, "Player2 did not return true");
          return contractInstance.endGame(gameNumber);
        })
        .then(result => {
          //console.log("Result from end game function: " + result.logs[0].args.winner);
          gas = result.receipt.gasUsed;
          assert.equal(result.receipt.status, true, "endGame did not return true");
          assert.equal(result.logs[0].args.winner, 0, "Game did not yield player 2 as the winner");
          return contractInstance.games.call(gameNumber, {from: owner});
        })
        .then(result => {
          assert.equal(result[0], 0, "Player1's address did not return correctly");
          assert.equal(result[1], 0, "Player2's address did not return correctly");
          assert.equal(result[2].valueOf(), 0, "Player1's move did not return correctly");
          assert.equal(result[3].valueOf(), 0, "Player2's move did not return correctly");
          assert.equal(result[4].valueOf(), false, "isLocked did not return false");
          assert.equal(result[5], 0, "Jackpot did not return correctly");

          return new Promise ((resolve, reject) => {
            web3.eth.getBalance(player2, (err, balance) => {
              if (err) reject(err)
              else resolve(balance)
            });
          });
          })
          .then(balance => {
            var balanceBeforeFormat;
            var balanceNowFormat;
             player2BalanceNow = balance;
             balanceBeforeFormat = parseInt(web3.fromWei((parseInt(player2BalanceBefore,10))));
             balanceNowFormat = parseInt(web3.fromWei(parseInt(player2BalanceNow.valueOf(),10)));
             //console.log("Balance Before: " + (parseInt(player2BalanceBefore) + parseInt(sendAmount)) + "\n" + "Balance Now: " + player2BalanceNow);
             assert.equal(balanceNowFormat, balanceBeforeFormat, "Balance did not resolve correctly");
          });
          //end test
        });

//end contract
});
