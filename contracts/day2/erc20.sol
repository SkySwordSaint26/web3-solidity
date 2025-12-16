// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GLDToken is ERC20, Pausable, Ownable {
    constructor(uint256 initialSupply) ERC20("Gold", "GLD") Ownable(msg.sender){
      _mint(msg.sender, initialSupply);
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
      super._update(from, to, value);
    } 

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
