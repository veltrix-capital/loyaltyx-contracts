// contracts/BaseToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BaseToken is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, OwnableUpgradeable {
    bool public transferable;

    function initialize(string memory name, string memory symbol, address owner) external initializer {
        __ERC20_init(name, symbol);
        __ERC20Burnable_init();
        __Ownable_init(owner);
        transferable = false;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function setTransferable(bool allowed) external onlyOwner {
        transferable = allowed;
    }

    function _update(address from, address to, uint256 amount)
        internal
        virtual
        override
    {
        if (!transferable) {
            require(from == address(0) || to == address(0), "Transfers are disabled");
        }
        super._update(from, to, amount);
    }
}
