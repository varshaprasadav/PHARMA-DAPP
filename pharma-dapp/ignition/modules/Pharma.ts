import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PharmaModule = buildModule("PharmaModule", (m) => {
  const pharma = m.contract("Pharma");
  return { pharma };
});

export default PharmaModule;
