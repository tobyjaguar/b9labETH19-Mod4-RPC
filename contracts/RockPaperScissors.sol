//Rock breaks Scissors
//Scissors cuts paper
//Paper covers Rock
//Rock = 1, Paper = 2, Scissor = 3
pragma solidity ^0.4.13;


contract RockPaperScissors {

    address public owner;

    struct Game {
        address player1;
        address player2;
        uint p1Move;
        uint p2Move;
        bool isLocked;
        uint256 jackpot;
    }

    mapping(uint256 => Game) public games;

    uint8[3][3] public gameLogic;

    event LogPlayer(address player, uint256 jackpot);
    event LogWinner(address winner);

    function RockPaperScissors()
    public
    {
        owner = msg.sender;
        gameLogic[0] = [0, 2, 1];
        gameLogic[1] = [1, 0, 2];
        gameLogic[2] = [2, 1, 0];
    }

    function player1(uint256 _game, uint _move)
    public
    payable
    returns(bool success)
    {
        require(msg.sender != 0);
        require(_game != 0);
        require(msg.value > 0);
        require(0 < _move && _move < 4);
        require(games[_game].player1 == 0);
        games[_game].player1 = msg.sender;
        games[_game].p1Move = _move - 1;
        games[_game].jackpot += msg.value;

        LogPlayer(msg.sender, msg.value);
        return true;

    }

    function player2(uint256 _game, uint _move)
    public
    payable
    returns(bool success)
    {
        require(msg.sender != 0);
        require(_game != 0);
        require(games[_game].player1 != 0);
        require(games[_game].player2 == 0);
        require(msg.value >= games[_game].jackpot);
        require(0 < _move && _move < 4);
        games[_game].player2 = msg.sender;
        games[_game].p2Move = _move - 1;
        games[_game].jackpot += msg.value;
        games[_game].isLocked = true;

        LogPlayer(msg.sender, msg.value);
        return true;
    }

    function endGame(uint256 _game)
    public
    returns(bool _won, address _winner)
    {
        require(_game != 0);
        require(games[_game].player1 != 0 && games[_game].player2 != 0);
        require(games[_game].jackpot > 0);
        require(games[_game].isLocked);
        uint256 amountToSend;
        uint outcome = gameLogic[games[_game].p1Move][games[_game].p2Move];
        if (outcome == 1) {
            _winner = games[_game].player1;
            amountToSend = games[_game].jackpot;
            games[_game].player1 = 0;
            games[_game].player2 = 0;
            games[_game].p1Move = 0;
            games[_game].p2Move = 0;
            games[_game].jackpot = 0;
            games[_game].isLocked = false;
            _winner.transfer(amountToSend);
            LogWinner(_winner);
            return (true, _winner);
        }
        if (outcome == 2) {
            _winner = games[_game].player2;
            amountToSend = games[_game].jackpot;
            games[_game].player1 = 0;
            games[_game].player2 = 0;
            games[_game].p1Move = 0;
            games[_game].p2Move = 0;
            games[_game].jackpot = 0;
            games[_game].isLocked = false;
            _winner.transfer(amountToSend);
            LogWinner(_winner);
            return (true, _winner);
        }
        if (outcome == 0) {
            address senderPlayer1 = games[_game].player1;
            address senderPlayer2 = games[_game].player2;
            amountToSend = games[_game].jackpot/2;
            games[_game].player1 = 0;
            games[_game].player2 = 0;
            games[_game].p1Move = 0;
            games[_game].p2Move = 0;
            games[_game].jackpot = 0;
            games[_game].isLocked = false;
            senderPlayer1.transfer(amountToSend);
            senderPlayer2.transfer(amountToSend);
            LogWinner(0);
            return (false, 0);
        }

    }

}
