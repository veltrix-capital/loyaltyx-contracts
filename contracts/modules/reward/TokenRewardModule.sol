// contracts/modules/reward/TokenRewardModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IRewardModule.sol";
import "../../BaseToken.sol"; // Assumes this is the token each business clones

contract TokenRewardModule is IRewardModule {
    function handle(bytes calldata data) external override {
        (address token, address user, uint256 amount) = abi.decode(data, (address, address, uint256));

        // Router must be the token's owner to mint
        require(BaseToken(token).owner() == address(this), "Unauthorized router");

        BaseToken(token).mint(user, amount);
    }
}
