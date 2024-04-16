// contracts/interfaces/IBusinessRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBusinessRegistry {
    function isBusiness(address addr) external view returns (bool);
    function getBusinessOwner(address business) external view returns (address);
    function getBusinessToken(address business) external view returns (address);
    function getRewardRouter(address business) external view returns (address);
    function getRedeemRouter(address business) external view returns (address);
}
