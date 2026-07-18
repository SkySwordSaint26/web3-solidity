import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BatchNFTUUPSModule = buildModule("BatchNFTUUPS", (m) => {
  // 1️⃣ Deploy implementation
  const implementation = m.contract("BatchNFT", [], {
    id: "BatchNFTImplementation",
  });

  // 2️⃣ Encode initializer call
  const initData = m.encodeFunctionCall(implementation, "initialize", []);

  // 3️⃣ Deploy proxy WITH initialization data
  const proxy = m.contract("UUPSProxy", [
    implementation,
    initData,
  ], {
    id: "BatchNFTProxy",
  });

  // 4️⃣ Attach ABI to proxy
  const batchNFT = m.contractAt("BatchNFT", proxy, {
    id: "BatchNFTProxyInstance",
  });

  return { batchNFT, proxy, implementation };
});

export default BatchNFTUUPSModule;