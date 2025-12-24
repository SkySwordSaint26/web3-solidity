import { expect } from "chai";
import { ethers, network } from "hardhat";

const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Mainnet fork", function() {
  const USDC_ADDRESS="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDC_WHALE="0x0044f127511830bf4483db87adde07e843e2c66b";

  it("should fork", async function(){
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("Block:", await ethers.provider.getBlockNumber());
    expect(blockNumber).to.be.greaterThan(20_000_000);
  });

  it("should impersonate and interact with usdc", async function() {
    const impersonateWhale = await helpers.impersonateAccount(USDC_WHALE);
    const whaleSigner = await ethers.getSigner(USDC_WHALE);

    
    const [funder, receiver] = await ethers.getSigners();
    await funder.sendTransaction({
      to: USDC_WHALE,
      value: ethers.parseEther("1"),
    })

    const usdc = await ethers.getContractAt(
      [
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address, uint256) returns (bool)"
      ],
      USDC_ADDRESS,
      whaleSigner
    );

    console.log("Signer address:", whaleSigner.address)
    console.log("Expected whale:", USDC_WHALE)


    const whaleBalanceBefore = await usdc.balanceOf(USDC_WHALE);
    console.log(whaleBalanceBefore.toString());
    expect(whaleBalanceBefore).to.be.gt(0);

    const amt = 1_000_000;
    await usdc.transfer(receiver.address, amt);

    const receiverBalance = await usdc.balanceOf(receiver.address);
    expect(receiverBalance).to.be.equal(amt);
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [USDC_WHALE],
    })

  });

});
