import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { RebaseERC20, RebaseERC20V2 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { parseEther } from "ethers";

describe("RebaseERC20 Upgradeability", function () {
    let rebaseTokenv1: RebaseERC20;
    let rebaseTokenv2: RebaseERC20V2;
    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let proxyAddress: string;

    this.beforeEach(async function(){
        [owner, alice, bob] = await ethers.getSigners();

        const RebaseERC20Factory = await ethers.getContractFactory("RebaseERC20");
        rebaseTokenv1 = await upgrades.deployProxy(
            RebaseERC20Factory,
            ["Rebase Token", "RBASE"],
            { initializer: "initialize", kind: "uups"}
        ) as unknown as RebaseERC20;

        await rebaseTokenv1.waitForDeployment();
        proxyAddress = await rebaseTokenv1.getAddress();
    });


    describe("Basic upgrade mechanics", function(){

        it("Should successfully upgrade from V1 to V2", async ()=>{
            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");
            rebaseTokenv2 = await upgrades.upgradeProxy(
                proxyAddress,
                RebaseERC20V2Factory,
                { unsafeAllow: ['constructor']}
            ) as unknown as RebaseERC20V2;
            await rebaseTokenv2.initializeV2();
            expect(await rebaseTokenv2.getAddress()).to.equal(proxyAddress);
        });

        it("Should revert upgrade from non-owner", async ()=>{
            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");

            await expect(
                upgrades.upgradeProxy(
                    proxyAddress,
                    RebaseERC20V2Factory.connect(alice)
                )
            ).to.reverted;
        });
    });

    describe("State preservation after upgrade", function() {
        this.beforeEach(async ()=>{
            // Alice deposit 2 ETH
            await rebaseTokenv1.connect(alice).mint(alice.address,0, {value: parseEther("2.0")});

            // Bob deposit 1 ETH
            await rebaseTokenv1.connect(bob).mint(bob.address,0 , {value: parseEther("1.0")});

            // Alice transfer bob 0.5 ETH
            await rebaseTokenv1.connect(alice).transfer(bob.address, parseEther("0.5"));
        });

        it("Should preserve balances after upgrade", async ()=> {
            const aliceBalanceBefore = await rebaseTokenv1.balanceOf(alice.address);
            const bobBalanceBefore = await rebaseTokenv1.balanceOf(bob.address);

            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");
            rebaseTokenv2 = await upgrades.upgradeProxy(
                proxyAddress,
                RebaseERC20V2Factory,
                {unsafeAllow: ['constructor']}
            ) as unknown as RebaseERC20V2;
            await rebaseTokenv2.initializeV2();

            const aliceBalanceAfter = await rebaseTokenv2.balanceOf(alice.address);
            const bobBalanceAfter = await rebaseTokenv2.balanceOf(bob.address);

            expect(aliceBalanceAfter).to.be.equal(aliceBalanceBefore);
            expect(bobBalanceAfter).to.be.equal(bobBalanceBefore);
        });


        it("Should preserve shares after upgrade", async ()=> {
            const aliceSharesBefore = await rebaseTokenv1.sharesOf(alice.address);
            const bobSharesBefore = await rebaseTokenv1.sharesOf(bob.address);
            const totalShares = await rebaseTokenv1.totalShares();

            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");
            rebaseTokenv2 = await upgrades.upgradeProxy(
                proxyAddress,
                RebaseERC20V2Factory,
                {unsafeAllow: ['constructor']}
            ) as unknown as RebaseERC20V2;
            await rebaseTokenv2.initializeV2();

            const aliceSharesAfter = await rebaseTokenv2.sharesOf(alice.address);
            const bobSharesAfter = await rebaseTokenv2.sharesOf(bob.address);
            const totalSharesAfter = await rebaseTokenv2.totalShares();
            expect(aliceSharesAfter).to.be.equal(aliceSharesBefore);
            expect(bobSharesAfter).to.be.equal(bobSharesBefore);
            expect(totalSharesAfter).to.be.equal(totalShares);
        });

        it("Should preserve owner after upgrade", async ()=> {
            const ownerBefore = await rebaseTokenv1.owner();

            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");
            rebaseTokenv2 = await upgrades.upgradeProxy(
                proxyAddress,
                RebaseERC20V2Factory,
                {unsafeAllow: ['constructor']}
            ) as unknown as RebaseERC20V2;
            await rebaseTokenv2.initializeV2();

            const ownerAfter = await rebaseTokenv2.owner();

            expect(ownerAfter).to.be.equal(ownerBefore);
            expect(ownerAfter).to.be.equal(owner.address);
        });

        it("Should preserve total supply after upgrade", async ()=> {
            const totalSupplyBefore = await rebaseTokenv1.totalSupply();

            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");
            rebaseTokenv2 = await upgrades.upgradeProxy(
                proxyAddress,
                RebaseERC20V2Factory,
                {unsafeAllow: ['constructor']}
            ) as unknown as RebaseERC20V2;
            await rebaseTokenv2.initializeV2();

            const totalSupplyAfter = await rebaseTokenv2.totalSupply();

            expect(totalSupplyAfter).to.be.equal(totalSupplyBefore);
        });

        it("Should preserve pause/unpause state after upgrade", async ()=> {
            // Check initial state is unpaused
            const pausedBefore = await rebaseTokenv1.paused();
            expect(pausedBefore).to.be.false;

            // Pause the contract
            await rebaseTokenv1.pause();
            const pausedAfterPause = await rebaseTokenv1.paused();
            expect(pausedAfterPause).to.be.true;

            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");
            rebaseTokenv2 = await upgrades.upgradeProxy(
                proxyAddress,
                RebaseERC20V2Factory,
                {unsafeAllow: ['constructor']}
            ) as unknown as RebaseERC20V2;
            await rebaseTokenv2.initializeV2();

            const pausedAfterUpgrade = await rebaseTokenv2.paused();

            expect(pausedAfterUpgrade).to.be.true;
        });
    });

    describe.skip("V1 functionality after upgrade", function() {
        this.beforeEach(async ()=>{
            // Mint alice tokens
            await rebaseTokenv1.connect(alice).mint(alice.address, 0 , {value: parseEther("2.0")});

            // Upgrade to V2
            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");
            rebaseTokenv2 = await upgrades.upgradeProxy(
                proxyAddress,
                RebaseERC20V2Factory
            ) as unknown as RebaseERC20V2;
        });

        it("Should allow minting after upgrade", async ()=>{
            
        });
        it("Should allow transfer after upgrade", async ()=>{});
        it("Should allow withdrawal after upgrade", async ()=>{});
        it("Should allow pause/unpause after upgrade", async ()=>{});
    });

    describe.skip("V2 functionalities", function(){
        this.beforeEach(async ()=>{
            // Make states in v1
            await rebaseTokenv1.connect(alice).mint(alice.address, 0 , {value: parseEther("2.0")});
        
            // Upgrade to V2
            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");
            rebaseTokenv2 = await upgrades.upgradeProxy(
                proxyAddress,
                RebaseERC20V2Factory
            ) as unknown as RebaseERC20V2;
        });

        it("Should return proper version", async ()=>{});
        it("Should set new feature", async ()=>{});
        it("Should get proper value of new feature", async ()=>{});
        it("Should emit new feature set event", async ()=>{});
        it("Should revert on set by non-owner", async ()=>{});
    });

    describe.skip("Rebase behaviour after upgrade", function(){
        this.beforeEach(async ()=>{
            // Make states in v1
            await rebaseTokenv1.connect(alice).mint(alice.address, 0 , {value: parseEther("2.0")});
        
            // Upgrade to V2
            const RebaseERC20V2Factory = await ethers.getContractFactory("RebaseERC20V2");
            rebaseTokenv2 = await upgrades.upgradeProxy(
                proxyAddress,
                RebaseERC20V2Factory
            ) as unknown as RebaseERC20V2;
        });

        it("Should maintain rebase functionality after upgrade",async ()=>{});
        it("Should handle deposits correctly after upgrade",async ()=>{});
    });

    describe.skip("Edge cases in upgrade", function(){
        it("Should handle upgrade when paused", async ()=>{});
        it("Should upgrade with zero balance", async ()=>{});
    });

});