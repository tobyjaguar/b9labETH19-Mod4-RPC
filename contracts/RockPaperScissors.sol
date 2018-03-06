//Rock breaks Scissors
//Scissors cuts paper
//Paper covers Rock
//Rock = 1, Paper = 2, Scissor = 3
pragma solidity ^0.4.13;


contract RockPaperScissors {

    address public owner;
    uint256 public deadline;

    struct Game {
        address player1;
        address player2;
        bytes32 p1HashedMove;
        uint8 p2Move;
        bool isP1Locked;
        bool isP2Locked;
        uint256 jackpot;
        uint256 p1Winnings;
        uint256 p2Winnings;
    }

    mapping(uint256 => Game) public games;

    uint8[3][3] public gameLogic;

    event LogPlayer(uint256 eGame, address ePlayer, uint256 eJackpot);
    event LogWinner(uint256 eGame, address eWinner, uint256 eAmount);
    event LogWithdraw(uint256 eGame, address eWinner, uint256 eAmount);
    event LogForfeit(uint256 eGame, address eWinner, uint256 eAmount);

    function RockPaperScissors(uint256 _expirationTime)
    public
    {
        owner = msg.sender;
        deadline = block.number + _expirationTime;
        gameLogic[0] = [0, 2, 1];
        gameLogic[1] = [1, 0, 2];
        gameLogic[2] = [2, 1, 0];
    }

    function helperHash(address _player, uint8 _move, bytes32 _unHashedPassword)
    public
    constant
    returns (bytes32 hashedOutput)
    {
        require(_player != 0);
        require(0 < _move && _move < 4);
        require(_unHashedPassword != 0);
        return keccak256(_player, _move, _unHashedPassword);
    }

    function player1(uint256 _game, bytes32 _hashedMove)
    public
    payable
    returns(bool success)
    {
        require(msg.sender != 0);
        require(_game != 0);
        require(msg.value > 0);
        require(!games[_game].isP1Locked);
        games[_game].player1 = msg.sender;
        games[_game].p1HashedMove = _hashedMove;
        games[_game].jackpot = msg.value;
        games[_game].isP1Locked = true;

        LogPlayer(_game, msg.sender, msg.value);
        return true;

    }

    function player2(uint256 _game, uint8 _p2Move)
    public
    payable
    returns(bool success)
    {
        require(msg.sender != 0);
        require(games[_game].player1 != 0);
        require(games[_game].player2 == 0);
        require(0 < _p2Move && _p2Move < 4);
        require(games[_game].isP1Locked);
        require(msg.value >= games[_game].jackpot);
        games[_game].player2 = msg.sender;
        games[_game].p2Move = _p2Move;
        games[_game].jackpot += msg.value;
        games[_game].isP2Locked = true;

        LogPlayer(_game, msg.sender, msg.value);
        return true;
    }

    function settleGame(uint256 _game, uint8 _p1Move, bytes32 _p1Password)
    public
    returns(bool sucess)
    {
        require(_game != 0);
        require(0 < _p1Move && _p1Move < 4);
        require(games[_game].p1HashedMove == helperHash(games[_game].player1, _p1Move, _p1Password));
        require(games[_game].isP1Locked && games[_game].isP2Locked);
        uint outcome = gameLogic[_p1Move - 1][games[_game].p2Move - 1];
        if (outcome == 0) {
            games[_game].p1Winnings = games[_game].jackpot / 2;
            games[_game].p2Winnings = games[_game].jackpot / 2;
            LogWinner(_game, 0x0, 0);
            return false;
        }
        if (outcome == 1) {
            //player 1 wins
            games[_game].p1Winnings = games[_game].jackpot;
            LogWinner(_game, games[_game].player1, games[_game].jackpot);
            return true;
        }
        if (outcome == 2) {
          //player 2 wins
            games[_game].p2Winnings = games[_game].jackpot;
            LogWinner(_game, games[_game].player2, games[_game].jackpot);
            return true;
        }
    }

    function withdrawPlayer1(uint256 _game)
    public
    returns(bool success)
    {
        require(games[_game].player1 == msg.sender);
        uint256 amountToSend = games[_game].p1Winnings;
        require(amountToSend != 0);
        if (games[_game].p1Winnings == (games[_game].jackpot / 2)) {
            games[_game].player1 = 0;
            games[_game].p1HashedMove = "";
            games[_game].isP1Locked = false;
            games[_game].p1Winnings = 0;
        }
        if (games[_game].p1Winnings == games[_game].jackpot) {
            resetGame(_game);
        }
        msg.sender.transfer(amountToSend);

        LogWithdraw(_game, msg.sender, amountToSend);
        return true;
    }

    function withdrawPlayer2(uint256 _game)
    public
    returns(bool success)
    {
        require(games[_game].player2 == msg.sender);
        uint256 amountToSend = games[_game].p2Winnings;
        require(amountToSend != 0);
        if (games[_game].p2Winnings == (games[_game].jackpot / 2)) {
            games[_game].player2 = 0;
            games[_game].p2Move = 0;
            games[_game].isP2Locked = false;
            games[_game].p2Winnings = 0;
        }
        if (games[_game].p2Winnings == games[_game].jackpot) {
            resetGame(_game);
        }
        msg.sender.transfer(amountToSend);

        LogWithdraw(_game, msg.sender, amountToSend);
        return true;
    }

    function forfeit(uint256 _game)
    public
    returns(bool success)
    {
        require(games[_game].player2 == msg.sender);
        require(deadline <= block.number);
        uint256 amountToSend = games[_game].jackpot;
        require(amountToSend != 0);
        resetGame(_game);
        msg.sender.transfer(amountToSend);

        LogForfeit(_game, msg.sender, amountToSend);
        return true;
    }

    function resetGame(uint256 _game)
    internal
    {
        games[_game].player1 = 0;
        games[_game].player2 = 0;
        games[_game].p1HashedMove = "";
        games[_game].p2Move = 0;
        games[_game].isP1Locked = false;
        games[_game].isP2Locked = false;
        games[_game].jackpot = 0;
        games[_game].p1Winnings = 0;
        games[_game].p2Winnings = 0;
    }

}
