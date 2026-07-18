// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;
import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BatchNFT is 
Initializable,
ERC721AUpgradeable, 
ERC2981Upgradeable, 
PausableUpgradeable, 
OwnableUpgradeable, 
UUPSUpgradeable {
    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        // Initialize Ownable FIRST before other inits
        __Ownable_init(msg.sender);
        
        // Then initialize ERC721A
        __ERC721A_init("Azuki","AZUKI");
        
        // Then other upgradeable contracts
        __Pausable_init();
        __ERC2981_init();
        __UUPSUpgradeable_init();
        
        // Set default royalty
        _setDefaultRoyalty(owner(), 500);
    }

    // only owner can mint in this minimal example
    function mint(address to, uint256 value) external onlyOwner {
        _mint(to, value);
    }

    function _baseURI() internal pure override returns (string memory){
        return "https://api.example.com/metadata/";
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // block transfers while paused
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
        require(!paused(), "Pausable: paused");
    }

    // simple withdraw helper (safer call pattern)
    function withdraw() external onlyOwner {
        (bool sent, ) = payable(owner()).call{value: address(this).balance}("");
        require(sent, "Withdraw failed");
    }

    function batchMint(uint256 quantity) external whenNotPaused {
        _mint(msg.sender, quantity);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function supportsInterface(bytes4 interfaceId) 
    public 
    view 
    override(ERC721AUpgradeable, ERC2981Upgradeable) 
    returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}