pragma solidity ^0.6.0;

contract FreeTokenVault {
    mapping(address => bool) public alreadyClaimed;
    IERC20 public token;

    constructor(IERC20 _token) public {
        token = _token;
    }

    function claimTestTokens() public {
        require(
            !alreadyClaimed[msg.sender],
            "You have already claimed your 100 test tokens !!"
        );

        alreadyClaimed[msg.sender] = true;

        token.transfer(msg.sender, 100);
    }

    function contractBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);
}
