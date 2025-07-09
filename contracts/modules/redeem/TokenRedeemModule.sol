// contracts/modules/redeem/TokenRedeemModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IRedeemModule.sol";
import "../../BaseToken.sol";

contract TokenRedeemModule is IRedeemModule {
    function handle(bytes calldata data) external override {
        (address token, address user, uint256 amount) = abi.decode(data, (address, address, uint256));

        // it doesn't require to have token ownership to burn. just need user's approval

        // Burn from user (router must be approved)
        BaseToken(token).burnFrom(user, amount);
    }
}
