// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBusinessRegistry {
    enum ModuleType {
        REWARD,
        REDEEM,
        SWAP,
        KYC,
        COUPON,
        NFT,
        ANALYTICS,
        OTHER
    }

    function acceptOwnership() external;

    function registerBusiness(
        string calldata name,
        string calldata metadataURI,
        address owner
    ) external returns (uint256 businessId);

    function getBusinessOwner(uint256 businessId) external view returns (address);

    function getBusinessToken(uint256 businessId) external view returns (address);

    function setBusinessToken(uint256 businessId, address token) external;

    function setBusinessRouters(
        uint256 businessId,
        address rewardRouter,
        address redeemRouter
    ) external;

    function getRewardRouter(uint256 businessId) external view returns (address);

    function getRedeemRouter(uint256 businessId) external view returns (address);

    function addModuleToBusiness(
        uint256 businessId,
        uint256 moduleType, // ModuleType enum cast to uint
        address module
    ) external;

    function getModules(
        uint256 businessId,
        uint256 moduleType
    ) external view returns (address[] memory);

}
