import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("ERC20 with Pausable", function(){
  let token;
  let owner, spender, receiver;
  const initialSupply = ethers.parseUnits("1000000", 18);

  beforeEach(async () => {
    [ owner, spender, receiver ] = await ethers.getSigners();
    const GLDToken = await ethers.getContractFactory("GLDToken");
    token = await GLDToken.deploy(initialSupply);
    await token.waitForDeployment();
  });

  it("should revert transfer when paused",async () => {
    await token.pause();

    await expect(token.connect(spender).transferFrom(owner.address, spender.address, 1000n)).to.be.reverted;
  });

  it("should transfer when not paused", async () => {
    // Approve the spender to use tokens
    await token.connect(owner).approve(spender.address,2000n);

    // Send transaction from spender to receiver
    await token.connect(spender).transferFrom(owner.address, receiver.address,1000n);
    expect(await token.balanceOf(receiver.address)).to.be.equal(1000n);

    await token.pause();
    await expect(token.connect(spender).transferFrom(owner.address,receiver.address,1n)).to.be.reverted;
  });

  it("should allow only owner to pause", async () => {
    await expect(token.connect(spender).pause()).to.be.reverted;
  });
});

