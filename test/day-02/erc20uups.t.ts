import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("ERC20UUPS", function () {
  let owner: any, spender: any, receiver: any;
  let token: any;
  let initialSupply = ethers.parseUnits("1000000", 18);

  beforeEach(async () => {
    [owner, spender, receiver] = await ethers.getSigners();

    const SLTToken = await ethers.getContractFactory("SLTToken");
    token = await upgrades.deployProxy(
      SLTToken,
      [],
      { initializer: "initialize", kind: "uups" }
    );

    await token.mint(owner.address, initialSupply);
  });

  it("should initialize", async () => {
    const name = await token.name();
    const symbol = await token.symbol();

    expect(name).to.be.equal("SLTToken");
    expect(symbol).to.be.equal("SLT");

    expect(await token.owner()).to.be.equal(owner.address);
  });
  it("should pause transfer", async () => {
    await token.pause();
    await expect(token.connect(owner).transfer(receiver.address, 1n)).to.be.reverted;
  });
});
