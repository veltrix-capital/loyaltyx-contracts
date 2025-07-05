// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BusinessRegistry is Initializable, OwnableUpgradeable {
    struct Business {
        address owner;
        string name;
        string metadataURI; // optional IPFS or URL for branding/config
    }

    uint256 public nextBusinessId;
    mapping(uint256 => Business) public businesses;

    event BusinessRegistered(uint256 indexed businessId, address indexed owner, string name);
    event BusinessNameUpdated(uint256 indexed businessId, string newName);
    event MetadataUpdated(uint256 indexed businessId, string newMetadata);
    event BusinessOwnershipTransferred(uint256 indexed businessId, address indexed previousOwner, address indexed newOwner);

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function registerBusiness(string calldata name, string calldata metadataURI) external returns (uint256) {
        uint256 businessId = ++nextBusinessId;
        businesses[businessId] = Business({
            owner: msg.sender,
            name: name,
            metadataURI: metadataURI
        });

        emit BusinessRegistered(businessId, msg.sender, name);
        return businessId;
    }

    function ownerOf(uint256 businessId) external view returns (address) {
        return businesses[businessId].owner;
    }

    function updateBusinessName(uint256 businessId, string calldata newName) external {
        require(msg.sender == businesses[businessId].owner, "Not business owner");
        businesses[businessId].name = newName;
        emit BusinessNameUpdated(businessId, newName);
    }

    function updateMetadataURI(uint256 businessId, string calldata newURI) external {
        require(msg.sender == businesses[businessId].owner, "Not business owner");
        businesses[businessId].metadataURI = newURI;
        emit MetadataUpdated(businessId, newURI);
    }

    function transferBusinessOwnership(uint256 businessId, address newOwner) external {
        address currentOwner = businesses[businessId].owner;
        require(msg.sender == currentOwner, "Not business owner");
        require(newOwner != address(0), "Invalid new owner");
        businesses[businessId].owner = newOwner;
        emit BusinessOwnershipTransferred(businessId, currentOwner, newOwner);
    }
}
