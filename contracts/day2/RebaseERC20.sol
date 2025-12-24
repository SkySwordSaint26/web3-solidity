// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract RebaseERC20 is Initializable, ERC20Upgradeable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable { 
  // Mapping for storing shares of users
  mapping(address => uint ) internal _shareBalance;
  uint256 internal _totalShares;

  // Events
  event Deposit(address indexed account, uint256 assets, uint256 shares);
  event Withdraw(address indexed account, uint256 assets, uint256 shares);

  function initialize(string memory name_, string memory symbol_) external initializer {
    __ERC20_init(name_, symbol_);
    __Ownable_init(msg.sender);
    __Pausable_init();
    __UUPSUpgradeable_init();

  }
  
  // ----------- VIEW Functions ----------- //
  function balanceOf(address account) public view override returns (uint256) {
    if(_totalShares == 0) return 0;
    uint256 totalAssets = address(this).balance;
    if(totalAssets == 0) return 0;
    return (_shareBalance[account] * totalAssets) / _totalShares;
  }
  
  function totalSupply() public view override returns(uint256) {
    return address(this).balance;
  } 

  function sharesOf(address account) public view returns(uint256) {
    return _shareBalance[account];
  }

  function totalShares() public view returns(uint256) {
    return _totalShares;
  }
  receive() external payable {}

  function _amountToShare(uint256 amount) internal view returns (uint256) {
    return _totalShares == 0 ? amount : (amount * _totalShares) / address(this).balance ;
  }

  function _shareToAmount(uint256 shares) internal view returns(uint256) {
    if(_totalShares == 0) return 0;
    return (shares * address(this).balance) / _totalShares;
  }

  function withdraw(uint256 shares) external whenNotPaused returns (uint256 assets) {
    require(shares > 0, "Zero shares");
    require(_shareBalance[msg.sender] >= shares, "Insufficient shares");
 
    uint256 totalAssets = address(this).balance;
    assets = (shares * totalAssets) / _totalShares;
    require(assets > 0, "Zero assets");
 
    _shareBalance[msg.sender] -= shares;
    _totalShares -= shares;
 
    emit Withdraw(msg.sender, assets, shares);
    emit Transfer(msg.sender, address(0), assets);
 
    (bool success, ) = msg.sender.call{value: assets}("");
    require(success, "ETH transfer failed");
 
    return assets;
  }

  function mint(address to, uint256 minSharesOut) external payable whenNotPaused{
    require(to != address(0), ERC20InvalidReceiver(to));
    require(msg.value > 0, "Zero deposit.");

    uint256 assetsBefore = address(this).balance - msg.value;
    
    uint256 sharesToCreate = _totalShares == 0 ? msg.value : msg.value * _totalShares / assetsBefore ;

    require(sharesToCreate >= minSharesOut, "slippage");

    _totalShares += sharesToCreate;
    _shareBalance[to] += sharesToCreate;

    emit Deposit(to, msg.value, sharesToCreate);
    emit Transfer(address(0), to, msg.value);
  }

  function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
    require(to != address(0), ERC20InvalidReceiver(to));
    require(address(this).balance > 0, "no assets");

    uint256 shares = amount * _totalShares / address(this).balance;

    require(_shareBalance[msg.sender] >= shares, "insufficient balance");
    
    _shareBalance[msg.sender] -= shares;
    _shareBalance[to] += shares;

    emit Transfer(msg.sender, to, amount);
    return true;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner{}

  function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
    require(from != address(0), "ERC20: transfer from zero address");
    require(to != address(0), "ERC20: transfer to zero address");
    require(amount > 0, "Zero amount");

    uint256 totalAssets = address(this).balance;
    require(totalAssets > 0, "No assets");

    // Convert amount to shares
    uint256 shares = (amount * _totalShares) / totalAssets;
    require(shares > 0, "Zero shares");
    require(_shareBalance[from] >= shares, "Insufficient balance");

    // Check and update allowance
    uint256 currentAllowance = allowance(from, msg.sender);
    require(currentAllowance >= amount, "ERC20: insufficient allowance");

    if (currentAllowance != type(uint256).max) {
        _approve(from, msg.sender, currentAllowance - amount);
    }

    // Transfer shares
    _shareBalance[from] -= shares;
    _shareBalance[to] += shares;

    emit Transfer(from, to, amount);
    return true;
  }

  // Pause Unpaused
  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }
}
