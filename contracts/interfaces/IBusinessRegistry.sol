// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBusinessRegistry {
    function ownerOf(uint256 businessId) external view returns (address);
}
