// contracts/interfaces/IRewardModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRewardModule {
    function handle(bytes calldata data) external;
}
