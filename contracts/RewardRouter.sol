// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./interfaces/IRewardModule.sol";

contract RewardRouter is Initializable, OwnableUpgradeable {
    /// @notice Maps behavior keys to reward module addresses
    mapping(bytes32 => address) public modules;

    /// @notice Initializes the router and sets owner
    function initialize(address owner_) public initializer {
        __Ownable_init(owner_);
    }

    /// @notice Sets or replaces a reward module for a given behavior key
    function setModule(bytes32 behavior, address module) external onlyOwner {
        modules[behavior] = module;
    }

    /// @notice Handles a user behavior by forwarding to the assigned module
    /// @param behavior key like "purchase" or "visit"
    /// @param user the customer wallet
    /// @param value optional numeric input (e.g. purchase amount)
    /// @param data arbitrary extra input (e.g. coupon ID, JSON)
    function handle(bytes32 behavior, address user, uint256 value, bytes calldata data) external onlyOwner {
        address module = modules[behavior];
        require(module != address(0), "No module registered");

        IRewardModule(module).handle(user, value, data);
    }
}
