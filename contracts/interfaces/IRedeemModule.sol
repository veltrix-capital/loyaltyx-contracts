// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Interface for all redeem modules (token, coupon, NFT, etc.)
interface IRedeemModule {
    /// @dev Executes redemption logic for a user based on the value and context data
    /// @param user Address of the user redeeming
    /// @param value Redemption input value (e.g. tokens to burn)
    /// @param data Additional input (e.g. redeem context like "hotel-stay", coupon ID, etc.)
    function handle(address user, uint256 value, bytes calldata data) external;
}
