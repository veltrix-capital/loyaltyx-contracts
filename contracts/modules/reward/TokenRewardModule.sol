// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../../interfaces/IRewardModule.sol";

interface IBaseToken {
    function mint(address to, uint256 amount) external;
}

contract TokenRewardModule is Initializable, OwnableUpgradeable, IRewardModule {
    address public token;
    uint256 public multiplier;

    /// @notice Initializes the module with the target token, reward multiplier, and module owner
    function initialize(address _token, uint256 _multiplier, address _owner) public initializer {
        __Ownable_init(_owner);
        token = _token;
        multiplier = _multiplier;
    }

    /// @notice Allows the owner to update the multiplier logic
    function setMultiplier(uint256 newMultiplier) external onlyOwner {
        multiplier = newMultiplier;
    }

    /// @notice Called by RewardRouter (or directly) to process a behavior
    function handle(address user, uint256 value, bytes calldata) external override onlyOwner {
        uint256 rewardAmount = value * multiplier;
        IBaseToken(token).mint(user, rewardAmount);
    }
}
