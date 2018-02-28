var RockPaperScissors = artifacts.require("./RockPaperScissors.sol");
//var MetaCoin = artifacts.require("./MetaCoin.sol");

module.exports = function(deployer) {
  deployer.deploy(RockPaperScissors);
};
