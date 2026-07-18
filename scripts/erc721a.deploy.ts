import { ethers, upgrades } from "hardhat";

async function main() {
  const BatchNFT = await ethers.getContractFactory("BatchNFT");
  
  const proxy = await upgrades.deployProxy(BatchNFT, [], {
    kind: "uups",
    initializer: "initialize",
  });

  await proxy.waitForDeployment();
  console.log("Proxy deployed to:", await proxy.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});