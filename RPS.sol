//Rock breaks Scissors
//Scissors cuts paper
//Paper covers Rock
//Rock = 1, Paper = 2, Scissor = 3
pragma solidity ^0.4.13;

contract RPS {
    address public owner;
    address public player1;
    address public player2;
    uint public p1Roll;
    uint public p2Roll;


    
    function RPC() 
    public
    {
        owner = msg.sender;
    }
    
    function enroll() 
    public 
    payable
    returns (bool success)
    {
        require(msg.sender != 0);
        require(msg.value > 0);
        if(msg.value == 123123) {
            player1 = msg.sender;
            return true;
        }
        if(msg.value == 456456) {
            player2 == msg.sender;
            return true;
        }
    }
    
    function play(uint roll)
    public
    payable
    {
        require(msg.value < 4);
        //Initial play
        if(p1Roll == 0 && p2Roll == 0) 
        {
            if(msg.sender == player1)
            {
                p1Roll = roll;
            }
            if(msg.sender == player2)
            {
                p2Roll = roll;
            }   
        }
        
        //Player 1 has played, but not player 2
        if(p1Roll > 0 && p2Roll == 0) 
        {
            if(msg.sender == player2)
            {
                p2Roll = roll;
            }   
        }
        
        //Player 2 has played, but not player 1
        if(p1Roll == 0 && p2Roll > 0) 
        {
            if(msg.sender == player1)
            {
                p1Roll = roll;
            }   
        }
        
        //Both players have played
        //Determine winner
        if(p1Roll > 0 && p2Roll > 0) 
        {
            //Tie
            if(p1Roll == p2Roll) 
            {
                //log event as tie
                //refund players
                //make for loop refund an array of addresses
                p1Roll = 0;
                p2Roll = 0;
            }
            
            //Rock vs Paper
            //p1 rock, p2 paper
            if(p1Roll == 1 && p2Roll == 2)
            {
                player2.transfer(this.balance);
                p1Roll = 0;
                p2Roll = 0;
            }
            //p1 paper, p2 rock
            if(p1Roll == 2 && p2Roll == 1)
            {
                player1.transfer(this.balance);
                p1Roll = 0;
                p2Roll = 0;
            }
            
            //Rock vs Scissors
            //p1 rock, p2 scissors
            if(p1Roll == 1 && p2Roll == 3)
            {
                player1.transfer(this.balance);
                p1Roll = 0;
                p2Roll = 0;
            }
            //p1 scissors, p2 rock
            if(p1Roll == 3 && p2Roll == 1)
            {
                player2.transfer(this.balance);
                p1Roll = 0;
                p2Roll = 0;
            }
            
            //Paper vs Scissors
            //p1 paper, p2 scissors
            if(p1Roll == 2 && p2Roll == 3)
            {
                player2.transfer(this.balance);
                p1Roll = 0;
                p2Roll = 0;
            }
            //p1 scissors, p2 paper
            if(p1Roll == 3 && p2Roll == 2)
            {
                player1.transfer(this.balance);
                p1Roll = 0;
                p2Roll = 0;
            }
        }
    }
}
