// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SLTToken is Initializable, ERC20Upgradeable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable {
  function initialize() initializer public {
    __ERC20_init("SLTToken", "SLT");
    __Ownable_init(msg.sender);
    __Pausable_init();
  }

  function mint(address account, uint256 value) external {
    super._mint(account, value);
  }

  function _authorizeUpgrade(address) internal override onlyOwner {}

  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }

  function _update(address from, address to, uint256 value) internal override whenNotPaused{
    super._update(from, to, value);
  }
}
