// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./BaseToken.sol";

contract TokenFactory {
    address public immutable baseTokenImplementation;
    mapping(address => address) public businessToToken;

    event TokenCreated(address indexed business, address token);

    constructor(address _baseTokenImplementation) {
        baseTokenImplementation = _baseTokenImplementation;
    }

    function createToken(string memory name, string memory symbol) external returns (address) {
        require(businessToToken[msg.sender] == address(0), "Token already created");

        address clone = Clones.clone(baseTokenImplementation);

        BaseToken(clone).initialize(name, symbol, msg.sender);
        businessToToken[msg.sender] = clone;

        emit TokenCreated(msg.sender, clone);
        return clone;
    }

    function getToken(address business) external view returns (address) {
        return businessToToken[business];
    }
}
