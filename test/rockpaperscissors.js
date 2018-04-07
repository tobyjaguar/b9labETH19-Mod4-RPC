Promise = require("bluebird");
var RockPaperScissors = artifacts.require("./RockPaperScissors.sol");
var BigNumber = require('bignumber.js');
const sequentialPromise = require("../utils/sequentialPromise.js");
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

  beforeEach(function() {
    return RockPaperScissors.new({from: owner})
    .then(function(instance) {
      contractInstance = instance;
    });
  });

  describe("play multiple games", function() {
    const gamePlay = [
      {gameID: 1, player1Move: 1, player2Move: 3}, //player1 wins
      {gameID: 2, player1Move: 2, player2Move: 2}, //players tie
      {gameID: 3, player1Move: 3, player2Move: 2}, //player1 wins
      {gameID: 4, player1Move: 1, player2Move: 2}, //player2 wins
      {gameID: 5, player1Move: 2, player2Move: 1} //player1 wins
    ];

    var p1Password = "abc";
    var p1HashedMove;
    var sendAmount = 1000;
    var blockExpiration = 3;

    function runGame(game) {
      var gasUsed = 0;
      var gasPrice = 0;
      var txFee = 0;

      return contractInstance.helperHash.call(player1, game.player1Move, p1Password)
      .then(p1HashedMove => {
        return contractInstance.createGame(game.gameID, player2, blockExpiration, p1HashedMove, {from: player1, value: sendAmount});
      })
      .then(txObj => {
        gasUsed = txObj.receipt.gasUsed;
        return web3.eth.getTransactionPromise(txObj.tx);
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee += gasUsed * gasPrice;
        return contractInstance.player2(game.gameID, game.player2Move, {from: player2, value: sendAmount});
      })
      .then(() => {
        return contractInstance.settleGame(game.gameID, game.player1Move, p1Password, {from: player1})
      })
      .then(txObj => {
        gasUsed = txObj.receipt.gasUsed;
        return web3.eth.getTransactionPromise(txObj.tx)
      })
      .then(tx => {
        gasPrice = tx.gasPrice;
        txFee += gasUsed * gasPrice;
        return contractInstance.winnings(player1, {from: player1});
      })
      .then(winnings => {
        return {fee: txFee, winnings: winnings };
      })
    }

    it("Should run multiple games", function() {
    var balanceBefore;

    gamePlay.reduce(
    (promise, game) => {
        return promise.then(collected => runGame(game)
                .then(result => ({
                    fee: result.fee.plus(collected.fee),
                    winnings: result.winnings.plus(collected.winnings)
                }))
        );
    },
    Promise.resolve({ fee: 0, winnings: 0 }) // Initial value of "collected" inside a promise
    )
    .then(totalResult => console.log(totalResult));

      //end test
    });
    //end describe
  });

//end contract
});
