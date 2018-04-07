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
        uint256 expiry;
        uint256 deadline;
    }

    mapping(uint256 => Game) public games;
    mapping(address => uint256) public winnings;

    uint8[4][4] public gameLogic;

    event LogGameCreated(uint256 eGame, address ePlayer1, address ePlayer2, uint256 eJackpot, uint256 eBlockExpiration);
    event LogPlayer2(uint256 eGame, address ePlayer2, uint256 eJackpot);
    event LogWinner(uint256 eGame, address eWinner, uint256 eAmount);
    event LogWithdraw(address eWinner, uint256 eAmount);
    event LogForfeit(uint256 eGame, address eWinner, uint256 eAmount);

    function RockPaperScissors()
    public
    {
        owner = msg.sender;
        gameLogic[1] = [0, 1, 3, 2];
        gameLogic[2] = [0, 2, 1, 3];
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

    function createGame(uint256 _game, address _player2, uint256 _expiration, bytes32 _hashedMove)
    public
    payable
    returns(bool success)
    {
        Game storage game = games[_game];
        require(msg.sender != 0);
        require(_game != 0);
        require(msg.value > 0);
        require(game.deadline == 0);

        game.player1 = msg.sender;
        game.player2 = _player2;
        game.p1HashedMove = _hashedMove;
        game.jackpot = msg.value;
        game.expiry = _expiration;
        game.deadline = block.number + _expiration;

        LogGameCreated(_game, msg.sender, _player2, msg.value, _expiration);
        return true;

    }

    function player2(uint256 _game, uint8 _p2Move)
    public
    payable
    returns(bool success)
    {
        Game storage game = games[_game];
        require(msg.sender == game.player2);
        require(0 < _p2Move && _p2Move < 4);
        require(msg.value == game.jackpot);
        game.deadline = block.number + game.expiry;
        game.p2Move = _p2Move;

        LogPlayer2(_game, msg.sender, msg.value);
        return true;
    }

    function settleGame(uint256 _game, uint8 _p1Move, bytes32 _p1Password)
    public
    returns(bool complete)
    {
        Game storage game = games[_game];
        require(_game != 0);
        require(game.p2Move != 0);
        require(0 < _p1Move && _p1Move < 4);
        require(game.p1HashedMove == helperHash(msg.sender, _p1Move, _p1Password));
        uint outcome = gameLogic[_p1Move][game.p2Move];
        require(0 < outcome && outcome < 4);
        uint jackpot = game.jackpot;
        if (outcome == 2) {
            //player 1 wins
            winnings[game.player1] += jackpot * 2;
            LogWinner(_game, game.player1, jackpot * 2);
        } else if (outcome == 3) {
          //player 2 wins
            winnings[game.player2] += jackpot * 2;
            LogWinner(_game, game.player2, jackpot * 2);
        } else {
            winnings[game.player1] += jackpot;
            winnings[game.player2] += jackpot;
            LogWinner(_game, 0x0, 0);
        }
        resetGame(_game);
        return true;
    }

    function withdraw()
    public
    returns(bool success)
    {
        uint256 amountToSend = winnings[msg.sender];
        require(amountToSend != 0);
        winnings[msg.sender] = 0;
        LogWithdraw(msg.sender, amountToSend);
        msg.sender.transfer(amountToSend);

        return true;
    }

    function forfeit(uint256 _game)
    public
    returns(bool success)
    {
        Game storage game = games[_game];
        require(game.deadline <= block.number);
        require(game.jackpot != 0);
        uint jackpot = game.jackpot;
        uint256 forfeitAmount;
        address receiver;
        if (game.p2Move == 0) {
            receiver = game.player1;
            forfeitAmount = jackpot;
        } else {
            receiver = game.player2;
            forfeitAmount = jackpot * 2;
        }
        resetGame(_game);
        winnings[receiver] += forfeitAmount;
        LogForfeit(_game, msg.sender, forfeitAmount);
        return true;
    }

    function resetGame(uint256 _game)
    internal
    {
        Game storage game = games[_game];
        game.player1 = 0;
        game.player2 = 0;
        game.p1HashedMove = "";
        game.p2Move = 0;
        game.jackpot = 0;
        game.expiry = 0;
        game.deadline = 0;
    }

}
