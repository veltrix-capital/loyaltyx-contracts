// contracts/interfaces/IRedeemModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRedeemModule {
    function handle(bytes calldata data) external;
}
