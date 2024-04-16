// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces.sol";

/// @notice Shared module. Called via delegatecall from a business RewardRouter.
contract ValueCouponRewardModule {
    /// handle payload:
    /// abi.encode(
    ///   address couponClone,   // BaseValueCoupon clone for this business
    ///   address from,          // business treasury / funding wallet
    ///   address to,            // user wallet to receive NFT
    ///   address businessToken, // ERC20 to escrow
    ///   uint256 amount,        // amount to escrow
    ///   uint64 expiry          // 0 = none, else unix ts
    ///   bool transferable      // true = can transfer, false = non-transferable
    /// )
    function handle(bytes calldata data) external {
        (
            address couponClone,
            address from,
            address to,
            address businessToken,
            uint256 amount,
            uint64 expiry,
            bool transferable
        ) = abi.decode(data, (address, address, address, address, uint256, uint64, bool));

        IValueCoupon(couponClone).mintAndEscrow(from, to, businessToken, amount, expiry, transferable);
    }
}
