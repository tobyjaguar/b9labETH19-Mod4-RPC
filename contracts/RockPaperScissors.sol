//Rock breaks Scissors
//Scissors cuts paper
//Paper covers Rock
//Rock = 1, Paper = 2, Scissor = 3
pragma solidity ^0.4.13;


contract RockPaperScissors {

    address public owner;
    uint256 public expiration;

    struct Game {
        address player1;
        address player2;
        bytes32 p1HashedMove;
        uint8 p2Move;
        uint256 jackpot;
        uint256 deadline;
    }

    mapping(uint256 => Game) public games;
    mapping(address => uint256) public winnings;

    uint8[4][4] public gameLogic;

    event LogGameCreated(uint256 eGame, address ePlayer1, address ePlayer2, uint256 eJackpot);
    event LogPlayer2(uint256 eGame, address ePlayer2, uint256 eJackpot);
    event LogWinner(uint256 eGame, address eWinner, uint256 eAmount);
    event LogWithdraw(address eWinner, uint256 eAmount);
    event LogForfeit(uint256 eGame, address eWinner, uint256 eAmount);

    function RockPaperScissors(uint256 _expirationTime)
    public
    {
        owner = msg.sender;
        expiration = _expirationTime;
        gameLogic[1] = [0, 1, 3, 2];
        gameLogic[2] = [0, 0, 1, 3];
        gameLogic[3] = [0, 3, 2, 1];
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

    function createGame(uint256 _game, address _player2, bytes32 _hashedMove)
    public
    payable
    returns(bool success)
    {
        require(msg.sender != 0);
        require(_game != 0);
        require(msg.value > 0);

        games[_game].player1 = msg.sender;
        games[_game].player2 = _player2;
        games[_game].p1HashedMove = _hashedMove;
        games[_game].jackpot = msg.value;
        games[_game].deadline = block.number + expiration;

        LogGameCreated(_game, msg.sender, _player2, msg.value);
        return true;

    }

    function player2(uint256 _game, uint8 _p2Move)
    public
    payable
    returns(bool success)
    {
        require(msg.sender == games[_game].player2);
        require(0 < _p2Move && _p2Move < 4);
        require(msg.value == games[_game].jackpot);
        games[_game].p2Move = _p2Move;

        LogPlayer2(_game, msg.sender, msg.value);
        return true;
    }

    function settleGame(uint256 _game, uint8 _p1Move, bytes32 _p1Password)
    public
    returns(bool hasWinner)
    {
        require(_game != 0);
        require(games[_game].p2Move != 0);
        require(0 < _p1Move && _p1Move < 4);
        require(games[_game].p1HashedMove == helperHash(msg.sender, _p1Move, _p1Password));
        uint outcome = gameLogic[_p1Move][games[_game].p2Move];
        if (outcome == 1) {
            winnings[games[_game].player1] = games[_game].jackpot;
            winnings[games[_game].player2] = games[_game].jackpot;
            LogWinner(_game, 0x0, 0);
            resetGame(_game);
            return false;
        }
        if (outcome == 2) {
            //player 1 wins
            winnings[games[_game].player1] = games[_game].jackpot * 2;
            LogWinner(_game, games[_game].player1, games[_game].jackpot * 2);
            resetGame(_game);
            return true;
        }
        if (outcome == 3) {
          //player 2 wins
            winnings[games[_game].player2] = games[_game].jackpot * 2;
            LogWinner(_game, games[_game].player2, games[_game].jackpot * 2);
            resetGame(_game);
            return true;
        }
    }

    function withdraw()
    public
    returns(bool success)
    {
        uint256 amountToSend = winnings[msg.sender];
        require(amountToSend != 0);
        winnings[msg.sender] = 0;
        msg.sender.transfer(amountToSend);

        LogWithdraw(msg.sender, amountToSend);
        return true;
    }

    function forfeit(uint256 _game)
    public
    returns(bool success)
    {
        require(games[_game].deadline <= block.number);
        require(games[_game].jackpot != 0);
        uint256 forfeitAmount;
        address receiver;
        if (games[_game].p2Move == 0) {
            receiver = games[_game].player1;
            forfeitAmount = games[_game].jackpot;
            games[_game].jackpot = 0;
        } else {
            receiver = games[_game].player2;
            forfeitAmount = games[_game].jackpot * 2;
            games[_game].jackpot = 0;
        }
        resetGame(_game);
        winnings[receiver] += forfeitAmount;
        LogForfeit(_game, msg.sender, forfeitAmount);
        return true;
    }

    function resetGame(uint256 _game)
    internal
    {
        games[_game].player1 = 0;
        games[_game].player2 = 0;
        games[_game].p1HashedMove = "";
        games[_game].p2Move = 0;
    }

}
