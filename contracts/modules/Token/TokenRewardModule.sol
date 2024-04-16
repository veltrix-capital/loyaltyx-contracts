// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../shared/interfaces/IRewardModule.sol";
import "./BaseToken.sol";

contract TokenRewardModule is IRewardModule {
    function handle(bytes calldata data) external override {
        (address token, address user, uint256 amount) = abi.decode(data, (address, address, uint256));

        // Router must have the Minter role for the token
        require(token != address(0), "Invalid token address");
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than zero");
        require(BaseToken(token).hasRole(BaseToken(token).MINTER_ROLE(), address(this)), "Unauthorized router");

        BaseToken(token).mint(user, amount);
    }
}
