// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../../interfaces/IRewardModule.sol";

interface IBaseToken {
    function mint(address to, uint256 amount) external;
}

/// @notice Reward module that mints tokens directly (amount calculated off-chain)
contract TokenRewardModule is Initializable, OwnableUpgradeable, IRewardModule {
    address public token;
    address public trustedRouter;

    event TokenRewarded(address indexed user, uint256 amount, string rewardType);

    /// @dev Initializes the reward module with the token and owner
    /// @param _token The token to mint
    /// @param _owner The owner (e.g. RewardRouter)
    function initialize(address _token, address _router, address _owner) public initializer {
        __Ownable_init(_owner);
        token = _token;
        trustedRouter = _router;
    }

    modifier onlyRouter() {
        require(msg.sender == trustedRouter, "Unauthorized router");
        _;
    }

    /// @dev Mints the provided amount to the user
    /// @param user Recipient of the reward
    /// @param value Amount to mint (already calculated off-chain)
    /// @param data Encoded string describing reward type (e.g., "purchase")
    function handle(address user, uint256 value, bytes calldata data) external override onlyRouter {
        require(value > 0, "Zero value");

        // DEBUG
        require(token != address(0), "Token is zero address");
        require(IBaseToken(token).mint.selector != bytes4(0), "Mint function not found");
        IBaseToken(token).mint(user, value);

        string memory rewardType = abi.decode(data, (string));
        emit TokenRewarded(user, value, rewardType);
    }
}
