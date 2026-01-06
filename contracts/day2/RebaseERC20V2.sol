// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RebaseERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract RebaseERC20V2 is Initializable, RebaseERC20 {
    uint private _version;
    uint256 public newFeature;

    event NewFeatureSet(uint256 value);
    event VersionUpdated(uint newVersion);

    /**
     * @custom:oz-upgrades-validate-as-initializer
     */
    function initializeV2() external reinitializer(2) {
        __ERC20_init("Rebase Token", "RBASE");
        __Ownable_init(msg.sender);
        _version = 2;
        emit VersionUpdated(2);
    }

    function setNewFeature(uint256 value) external onlyOwner {
        newFeature = value;
        emit NewFeatureSet(value);
    }

    function getNewFeature() external view returns (uint256) {
        return newFeature;
    }

    function version() external pure returns (string memory) {
        return "V2";
    }
}