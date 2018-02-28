//Rock breaks Scissors
//Scissors cuts paper
//Paper covers Rock
//Rock = 1, Paper = 2, Scissor = 3
pragma solidity ^0.4.13;


contract RockPaperScissors {

    address public owner;
    uint256 public balance;

    struct Game {
        address player1;
        address player2;
        bytes32 p1HashedMove;
        bytes32 p2HashedMove;
        bool isLocked;
        uint256 jackpot;
    }

    mapping(uint256 => Game) public games;

    uint8[3][3] public gameLogic;

    event LogPlayer(address ePlayer, uint256 eJackpot);
    event LogWinner(address eWinner, uint256 eAmount);

    function RockPaperScissors()
    public
    {
        owner = msg.sender;
        gameLogic[0] = [0, 2, 1];
        gameLogic[1] = [1, 0, 2];
        gameLogic[2] = [2, 1, 0];
    }

    function getBalance()
    public
    constant
    returns (uint256 _balance)
    {
        return balance;
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
        require(games[_game].player1 == 0);
        games[_game].player1 = msg.sender;
        games[_game].p1HashedMove = _hashedMove;
        games[_game].jackpot += msg.value;
        balance += msg.value;

        LogPlayer(msg.sender, msg.value);
        return true;

    }

    function player2(uint256 _game, bytes32 _hashedMove)
    public
    payable
    returns(bool success)
    {
        require(msg.sender != 0);
        require(_game != 0);
        require(games[_game].player1 != 0);
        require(games[_game].player2 == 0);
        require(msg.value >= games[_game].jackpot);
        games[_game].player2 = msg.sender;
        games[_game].p2HashedMove = _hashedMove;
        games[_game].jackpot += msg.value;
        games[_game].isLocked = true;
        balance += msg.value;

        LogPlayer(msg.sender, msg.value);
        return true;
    }

    function settleGame(uint256 _game, uint8 _p1Move, uint8 _p2Move, bytes32 _p1Password, bytes32 _p2Password)
    public
    returns(bool won, address winner)
    {
        require(_game != 0);
        require(0 < _p1Move && _p1Move < 4);
        require(0 < _p2Move && _p2Move < 4);
        require(games[_game].p1HashedMove == helperHash(games[_game].player1, _p1Move, _p1Password));
        require(games[_game].p2HashedMove == helperHash(games[_game].player2, _p2Move, _p2Password));
        require(games[_game].jackpot > 0);
        require(games[_game].isLocked);
        uint256 amountToSend;
        uint outcome = gameLogic[_p1Move - 1][_p2Move - 1];
        if (outcome == 1) {
            winner = games[_game].player1;
            amountToSend = games[_game].jackpot;
            resetGame(_game);
            balance -= amountToSend;
            winner.transfer(amountToSend);
            LogWinner(winner, amountToSend);
            return (true, winner);
        }
        if (outcome == 2) {
            winner = games[_game].player2;
            amountToSend = games[_game].jackpot;
            resetGame(_game);
            balance -= amountToSend;
            winner.transfer(amountToSend);
            LogWinner(winner, amountToSend);
            return (true, winner);
        }
        if (outcome == 0) {
            address senderPlayer1 = games[_game].player1;
            address senderPlayer2 = games[_game].player2;
            amountToSend = games[_game].jackpot/2;
            resetGame(_game);
            balance -= (amountToSend * 2);
            senderPlayer1.transfer(amountToSend);
            senderPlayer2.transfer(amountToSend);
            LogWinner(0x0, amountToSend);
            return (false, 0);
        }
    }

    function resetGame(uint256 _game)
    internal
    {
        games[_game].player1 = 0;
        games[_game].player2 = 0;
        games[_game].p1HashedMove = "";
        games[_game].p2HashedMove = "";
        games[_game].jackpot = 0;
        games[_game].isLocked = false;
    }

}
