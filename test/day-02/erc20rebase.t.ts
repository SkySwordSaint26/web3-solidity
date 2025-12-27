import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { RebaseERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ERC20 Rebse", function () {
  let rebaseToken: RebaseERC20;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;

  beforeEach(async () => {
    [owner, alice, bob, charlie] = await ethers.getSigners();

    const rebaseContractFactory = await ethers.getContractFactory("RebaseERC20");
    rebaseToken = await upgrades.deployProxy(
      rebaseContractFactory,
      ["Rebase Tokne", "RBT"],
      { initializer: "initialize", kind: "uups" }
    ) as unknown as RebaseERC20;

    await rebaseToken.waitForDeployment();
  });

  describe("Initialization", function () {
    it("should initialize with name and symbol", async () => {
      expect(await rebaseToken.name()).to.be.equal("Rebase Tokne");
      expect(await rebaseToken.symbol()).to.be.equal("RBT");
    });

    it("should initialize with zero total supply", async () => {
      expect(await rebaseToken.totalSupply()).to.be.equal(0);
    });

    it("should initialize with correct owner", async () => {
      expect(await rebaseToken.totalSupply()).to.be.equal(0);
    });
    it("should initialize with zero total shares", async () => {
      expect(await rebaseToken.totalShares()).to.be.equal(0);
    });

    it("should not be paused initially", async () => {
      expect(await rebaseToken.paused()).to.be.equal(false);
    });
  });

  describe("Mint/Deposit", function () {
    it("should mint tokens when ETH deposit", async () => {
      const deopsitAmount = ethers.parseEther("1.0");

      await rebaseToken.connect(alice).mint(alice.address, 0, { value: deopsitAmount });

      expect(await rebaseToken.balanceOf(alice.address)).to.be.equal(deopsitAmount);
      expect(await rebaseToken.totalSupply()).to.be.equal(deopsitAmount);
    });

    it("should track shares correctly on first deposit", async () => {
      const deopsitAmount = ethers.parseEther("1.0");

      await rebaseToken.connect(alice).mint(alice.address, 0, { value: deopsitAmount });

      expect(await rebaseToken.sharesOf(alice.address)).to.be.equal(deopsitAmount);
      expect(await rebaseToken.totalShares()).to.be.equal(deopsitAmount);

    });


    it("should calculate shares correctly on subsequent deposit", async () => {
      await rebaseToken.connect(alice).mint(alice.address, 0, { value: ethers.parseEther("1.0") });
      await rebaseToken.connect(bob).mint(bob.address, 0, { value: ethers.parseEther("1.0") });

      const aliceShares = await rebaseToken.sharesOf(alice.address);
      const bobShares = await rebaseToken.sharesOf(bob.address);

      expect(aliceShares).to.be.equal(bobShares);
      expect(await rebaseToken.totalShares()).to.be.equal(ethers.parseEther("2.0"));
    });

    it("should revert on zero deposit", async () => {
      await expect(
        rebaseToken.connect(alice).mint(alice.address, 0, { value: 0 })
      ).to.be.revertedWith("Zero deposit.");
    });
    
    it("should revert on minting to zero address", async () => {
      await expect(
        rebaseToken.connect(alice).mint(ethers.ZeroAddress,0,{value: ethers.parseEther("1.0")})
      ).to.be.reverted;
    });

    it("should enforce slippage protection", async () => {
      const deopsitAmount = ethers.parseEther("1.0");

      await expect(
        rebaseToken.connect(alice).mint(alice.address, ethers.parseEther("2.0"), { value: deopsitAmount })
      ).to.be.revertedWith("slippage");
    });

    it("should emit transfer and deposit events", async () => {
      const deopsitAmount = ethers.parseEther("1.0");
      
      await expect(
        rebaseToken.connect(alice).mint(alice.address, 0, { value: deopsitAmount })
      ).to.emit(rebaseToken, "Transfer").withArgs(ethers.ZeroAddress, alice.address, deopsitAmount)
       .and.to.emit(rebaseToken, "Deposit").withArgs(alice.address, deopsitAmount, deopsitAmount);
    });
  });

  describe("Rebase effect", function (){
    it("should adjust balances after rebase", async ()=> {
      await rebaseToken.connect(alice).mint(alice.address, 0, { value: ethers.parseEther("1.0") });

      // Simulate rebase by sending ETH directly to the contract
      await owner.sendTransaction({
        to: rebaseToken.target,
        value: ethers.parseEther("1.0")
      });

      const aliceBalance = await rebaseToken.balanceOf(alice.address);
      expect(aliceBalance).to.be.equal(ethers.parseEther("2.0"));
    });

    it("Should maintain proportional ownership", async ()=>{
      await rebaseToken.connect(alice).mint(alice.address, 0, { value: ethers.parseEther("3.0")});
      await rebaseToken.connect(bob).mint(bob.address, 0, { value: ethers.parseEther("1.0")});

      const aliceBalance = await rebaseToken.balanceOf(alice.address);
      const bobBalance = await rebaseToken.balanceOf(bob.address);
      const totalSupply = await rebaseToken.totalSupply();

      const aliceShares = await rebaseToken.sharesOf(alice.address);
      const bobShares = await rebaseToken.sharesOf(bob.address);
      const totalShares = await rebaseToken.totalShares();

      expect(aliceShares).to.be.equal(ethers.parseEther("3.0"));
      expect(bobShares).to.be.equal(ethers.parseEther("1.0"));
      expect(totalShares).to.be.equal(ethers.parseEther("4.0"));
      expect(aliceBalance * 4n).to.be.equal(totalSupply * 3n);
      expect(bobBalance * 4n).to.be.equal(totalSupply * 1n);
    });

    it("should handle rebase via receive", async ()=>{
      await rebaseToken.connect(alice).mint(alice.address, 0, { value: ethers.parseEther("2.0")});

      const aliceBalanceBefore = await rebaseToken.balanceOf(alice.address);
      expect(aliceBalanceBefore).to.be.equal(ethers.parseEther("2.0"));

      // Simulate rebase by sending ETH directly to the contract
      await owner.sendTransaction({
        to: rebaseToken.target,
        value: ethers.parseEther("2.0")
      });

      const aliceBalanceAfter = await rebaseToken.balanceOf(alice.address);
      expect(aliceBalanceAfter).to.be.equal(ethers.parseEther("4.0"));
    });
  });

  describe("Transfer", function () {
    beforeEach(async () => {
      await rebaseToken.connect(alice).mint(alice.address, 0, { value: ethers.parseEther("2.0")});
    });

    it("should transfer tokens correctly", async () => {
      await rebaseToken.connect(alice).transfer(bob.address, ethers.parseEther("1.0"));

      expect(await rebaseToken.balanceOf(alice.address)).to.be.equal(ethers.parseEther("1.0"));
      expect(await rebaseToken.balanceOf(bob.address)).to.be.equal(ethers.parseEther("1.0"));
    });

    it("should adjust shares on transfer", async () => {
      const aliceSharesBefore = await rebaseToken.sharesOf(alice.address);
      const bobSharesBefore = await rebaseToken.sharesOf(bob.address);

      await rebaseToken.connect(alice).transfer(bob.address, ethers.parseEther("1.0"));

      const aliceSharesAfter = await rebaseToken.sharesOf(alice.address);
      const bobSharesAfter = await rebaseToken.sharesOf(bob.address);

      expect(aliceSharesAfter).to.be.lessThan(aliceSharesBefore);
      expect(bobSharesAfter).to.be.greaterThan(bobSharesBefore);
    });

    it("should emit Transfer event", async () => {
      await expect(
        rebaseToken.connect(alice).transfer(bob.address, ethers.parseEther("1.0"))
      ).to.emit(rebaseToken, "Transfer").withArgs(alice.address, bob.address, ethers.parseEther("1.0"));
    });
  });
});
