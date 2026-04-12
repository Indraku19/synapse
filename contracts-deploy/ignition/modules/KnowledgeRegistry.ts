import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("KnowledgeRegistry", (m) => {
  const registry = m.contract("KnowledgeRegistry");
  return { registry };
});
