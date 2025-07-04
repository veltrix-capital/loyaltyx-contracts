// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";

import "../../interfaces/IRedeemModule.sol";

contract TokenBurnRedeemModule is Initializable, OwnableUpgradeable, IRedeemModule {
    ERC20BurnableUpgradeable public token;

    event TokenRedeemed(address indexed user, uint256 amount, string rewardType);

    function initialize(address _token, address _owner) public initializer {
        __Ownable_init(_owner);
        token = ERC20BurnableUpgradeable(_token);
    }

    function redeem(address user, uint256 value, bytes calldata data) external override onlyOwner {
        require(value > 0, "Zero amount");
        token.burnFrom(user, value);

        string memory rewardType = abi.decode(data, (string));
        emit TokenRedeemed(user, value, rewardType);
    }
}
