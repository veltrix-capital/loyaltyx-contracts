// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRewardModule {
    function handle(address user, uint256 value, bytes calldata data) external;
}