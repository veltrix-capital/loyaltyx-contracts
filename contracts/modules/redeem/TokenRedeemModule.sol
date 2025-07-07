// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";

import "../../interfaces/IRedeemModule.sol";

/// @notice Redeem module that burns ERC20 tokens on redeem
contract TokenRedeemModule is Initializable, OwnableUpgradeable, IRedeemModule {
    ERC20BurnableUpgradeable public token;
    address public trustedRouter;

    event TokenRedeemed(address indexed user, uint256 amount, string redeemType);

    /// @dev Initializes the module with the token to burn and the module owner
    /// @param _token Address of the ERC20Burnable token
    /// @param _owner Owner address (e.g., RedeemRouter)
    function initialize(address _token, address _router, address _owner) public initializer {
        __Ownable_init(_owner);
        token = ERC20BurnableUpgradeable(_token);
        trustedRouter = _router;
    }

    modifier onlyRouter() {
        require(msg.sender == trustedRouter, "Unauthorized router");
        _;
    }

    /// @dev Burns tokens from the user during redeem
    /// @param user The user redeeming the value
    /// @param value The amount of tokens to burn
    /// @param data Encoded string (e.g., redeem type: "hotel-stay", "discount", etc.)
    function handle(address user, uint256 value, bytes calldata data) external override onlyRouter {
        require(value > 0, "Zero amount");
        token.burnFrom(user, value);

        string memory redeemType = abi.decode(data, (string));
        emit TokenRedeemed(user, value, redeemType);
    }
}
