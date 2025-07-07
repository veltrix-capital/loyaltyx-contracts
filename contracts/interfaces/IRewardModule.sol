// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Interface for all reward modules (token, coupon, NFT, etc.)
interface IRewardModule {
    /// @dev Executes reward logic for a user based on the value and context data
    /// @param user Address of the user receiving a reward
    /// @param value Activity value (e.g. purchase amount, visit count, etc.)
    /// @param data Context input (e.g. behavior type, location ID, etc.)
    function handle(address user, uint256 value, bytes calldata data) external;
}
