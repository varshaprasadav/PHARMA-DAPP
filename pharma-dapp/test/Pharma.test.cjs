// test/Pharma.test.js
// Run: npm test  OR  npx hardhat test

const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("Pharma Supply Chain", function () {

  let pharma;
  let manufacturer, distributor, pharmacy, customer;

  // ── Deploy contract before each test ──────────────────
  beforeEach(async function () {
    // Get test accounts from Hardhat
    [manufacturer, distributor, pharmacy, customer] = await ethers.getSigners();

    // Deploy the Pharma contract
    const Pharma = await ethers.getContractFactory("Pharma");
    pharma = await Pharma.deploy();
    await pharma.waitForDeployment();
  });

  // ════════════════════════════════════════════════════════
  // TEST 1: Add Medicine
  // ════════════════════════════════════════════════════════
  describe("1. Add Medicine", function () {

    it("should add medicine to blockchain", async function () {
      await pharma.connect(manufacturer).addMedicine(
        "MED001",
        "Paracetamol 500mg",
        "BATCH-2024-01",
        "2024-01-01",
        "2027-01-01",
        "ABC Pharma"
      );

      const medicine = await pharma.getMedicine("MED001");
      expect(medicine.medicineId).to.equal("MED001");
      expect(medicine.name).to.equal("Paracetamol 500mg");
      expect(medicine.manufacturerName).to.equal("ABC Pharma");
      console.log("      ✅ Medicine added:", medicine.name);
    });

    it("should set manufacturer as initial owner", async function () {
      await pharma.connect(manufacturer).addMedicine(
        "MED002", "Amoxicillin", "B-001", "2024-01-01", "2026-01-01", "ABC Pharma"
      );
      const medicine = await pharma.getMedicine("MED002");
      expect(medicine.currentOwner).to.equal(manufacturer.address);
      console.log("      ✅ Owner is manufacturer:", truncate(manufacturer.address));
    });

    it("should set status to Manufactured (0)", async function () {
      await pharma.connect(manufacturer).addMedicine(
        "MED003", "Ibuprofen", "B-002", "2024-01-01", "2026-01-01", "ABC Pharma"
      );
      const medicine = await pharma.getMedicine("MED003");
      expect(medicine.currentStatus).to.equal(0);
      console.log("      ✅ Status is Manufactured (0)");
    });

    it("should NOT add same medicine ID twice", async function () {
      await pharma.connect(manufacturer).addMedicine(
        "MED004", "Aspirin", "B-003", "2024-01-01", "2026-01-01", "ABC Pharma"
      );
      await expect(
        pharma.connect(manufacturer).addMedicine(
          "MED004", "Aspirin", "B-003", "2024-01-01", "2026-01-01", "ABC Pharma"
        )
      ).to.be.revertedWith("Medicine already exists");
      console.log("      ✅ Duplicate medicine rejected");
    });

    it("should emit MedicineAdded event", async function () {
      await expect(
        pharma.connect(manufacturer).addMedicine(
          "MED005", "Paracetamol", "B-004", "2024-01-01", "2026-01-01", "ABC Pharma"
        )
      ).to.emit(pharma, "MedicineAdded")
       .withArgs("MED005", "Paracetamol", manufacturer.address, await getTimestamp());
      console.log("      ✅ MedicineAdded event emitted");
    });

  });

  // ════════════════════════════════════════════════════════
  // TEST 2: Assign Distributor
  // ════════════════════════════════════════════════════════
  describe("2. Assign Distributor", function () {

    beforeEach(async function () {
      await pharma.connect(manufacturer).addMedicine(
        "MED001", "Paracetamol", "B-001", "2024-01-01", "2026-01-01", "ABC Pharma"
      );
    });

    it("should assign distributor and transfer ownership", async function () {
      await pharma.connect(manufacturer).assignDistributor(
        "MED001", "XYZ Distributors", distributor.address
      );
      const medicine = await pharma.getMedicine("MED001");
      expect(medicine.distributorName).to.equal("XYZ Distributors");
      expect(medicine.currentOwner).to.equal(distributor.address);
      expect(medicine.currentStatus).to.equal(1); // ShippedToDistributor
      console.log("      ✅ Ownership transferred to distributor:", truncate(distributor.address));
    });

    it("should NOT allow non-owner to assign distributor", async function () {
      await expect(
        pharma.connect(customer).assignDistributor(
          "MED001", "XYZ Distributors", distributor.address
        )
      ).to.be.revertedWith("Not the owner");
      console.log("      ✅ Non-owner correctly rejected");
    });

    it("should emit DistributorUpdated event", async function () {
      await expect(
        pharma.connect(manufacturer).assignDistributor(
          "MED001", "XYZ Distributors", distributor.address
        )
      ).to.emit(pharma, "DistributorUpdated");
      console.log("      ✅ DistributorUpdated event emitted");
    });

    it("should emit OwnershipTransferred event", async function () {
      await expect(
        pharma.connect(manufacturer).assignDistributor(
          "MED001", "XYZ Distributors", distributor.address
        )
      ).to.emit(pharma, "OwnershipTransferred");
      console.log("      ✅ OwnershipTransferred event emitted");
    });

  });

  // ════════════════════════════════════════════════════════
  // TEST 3: Distributor Actions
  // ════════════════════════════════════════════════════════
  describe("3. Distributor Actions", function () {

    beforeEach(async function () {
      await pharma.connect(manufacturer).addMedicine(
        "MED001", "Paracetamol", "B-001", "2024-01-01", "2026-01-01", "ABC Pharma"
      );
      await pharma.connect(manufacturer).assignDistributor(
        "MED001", "XYZ Distributors", distributor.address
      );
    });

    it("should confirm receipt by distributor", async function () {
      await pharma.connect(distributor).receiveByDistributor("MED001");
      const medicine = await pharma.getMedicine("MED001");
      expect(medicine.currentStatus).to.equal(2); // ReceivedByDistributor
      console.log("      ✅ Receipt confirmed, status = ReceivedByDistributor (2)");
    });

    it("should NOT allow wrong account to confirm receipt", async function () {
      await expect(
        pharma.connect(customer).receiveByDistributor("MED001")
      ).to.be.revertedWith("Not the owner");
      console.log("      ✅ Wrong account rejected for receipt");
    });

    it("should send medicine to pharmacy", async function () {
      await pharma.connect(distributor).receiveByDistributor("MED001");
      await pharma.connect(distributor).assignPharmacy(
        "MED001", "City Pharmacy", pharmacy.address
      );
      const medicine = await pharma.getMedicine("MED001");
      expect(medicine.pharmacyName).to.equal("City Pharmacy");
      expect(medicine.currentOwner).to.equal(pharmacy.address);
      expect(medicine.currentStatus).to.equal(3); // SentToPharmacy
      console.log("      ✅ Medicine sent to pharmacy:", truncate(pharmacy.address));
    });

    it("should emit PharmacyUpdated event", async function () {
      await pharma.connect(distributor).receiveByDistributor("MED001");
      await expect(
        pharma.connect(distributor).assignPharmacy(
          "MED001", "City Pharmacy", pharmacy.address
        )
      ).to.emit(pharma, "PharmacyUpdated");
      console.log("      ✅ PharmacyUpdated event emitted");
    });

  });

  // ════════════════════════════════════════════════════════
  // TEST 4: Pharmacy Actions
  // ════════════════════════════════════════════════════════
  describe("4. Pharmacy Actions", function () {

    beforeEach(async function () {
      // Full supply chain setup
      await pharma.connect(manufacturer).addMedicine(
        "MED001", "Paracetamol", "B-001", "2024-01-01", "2026-01-01", "ABC Pharma"
      );
      await pharma.connect(manufacturer).assignDistributor(
        "MED001", "XYZ Distributors", distributor.address
      );
      await pharma.connect(distributor).receiveByDistributor("MED001");
      await pharma.connect(distributor).assignPharmacy(
        "MED001", "City Pharmacy", pharmacy.address
      );
    });

    it("should mark medicine as available at pharmacy", async function () {
      await pharma.connect(pharmacy).markAvailableAtPharmacy("MED001");
      const medicine = await pharma.getMedicine("MED001");
      expect(medicine.currentStatus).to.equal(4); // AvailableAtPharmacy
      console.log("      ✅ Medicine marked available at pharmacy (4)");
    });

    it("should sell medicine", async function () {
      await pharma.connect(pharmacy).markAvailableAtPharmacy("MED001");
      await pharma.connect(pharmacy).sellMedicine("MED001");
      const medicine = await pharma.getMedicine("MED001");
      expect(medicine.currentStatus).to.equal(5); // Sold
      console.log("      ✅ Medicine sold, status = Sold (5)");
    });

    it("should emit MedicineSold event", async function () {
      await pharma.connect(pharmacy).markAvailableAtPharmacy("MED001");
      await expect(
        pharma.connect(pharmacy).sellMedicine("MED001")
      ).to.emit(pharma, "MedicineSold");
      console.log("      ✅ MedicineSold event emitted");
    });

    it("should NOT allow wrong account to sell", async function () {
      await pharma.connect(pharmacy).markAvailableAtPharmacy("MED001");
      await expect(
        pharma.connect(customer).sellMedicine("MED001")
      ).to.be.revertedWith("Not the owner");
      console.log("      ✅ Wrong account rejected for selling");
    });

  });

  // ════════════════════════════════════════════════════════
  // TEST 5: Full Supply Chain Flow
  // ════════════════════════════════════════════════════════
  describe("5. Complete Supply Chain Flow", function () {

    it("should complete full journey from manufacturer to sold", async function () {
      console.log("      🏭 Step 1: Manufacturer adds medicine...");
      await pharma.connect(manufacturer).addMedicine(
        "MED001", "Paracetamol 500mg", "BATCH-2024", "2024-01-01", "2027-01-01", "ABC Pharma"
      );
      let m = await pharma.getMedicine("MED001");
      expect(m.currentStatus).to.equal(0);
      console.log("         Status:", statusName(0));

      console.log("      📦 Step 2: Assign distributor...");
      await pharma.connect(manufacturer).assignDistributor(
        "MED001", "XYZ Distributors", distributor.address
      );
      m = await pharma.getMedicine("MED001");
      expect(m.currentStatus).to.equal(1);
      console.log("         Status:", statusName(1));

      console.log("      ✅ Step 3: Distributor confirms receipt...");
      await pharma.connect(distributor).receiveByDistributor("MED001");
      m = await pharma.getMedicine("MED001");
      expect(m.currentStatus).to.equal(2);
      console.log("         Status:", statusName(2));

      console.log("      🏪 Step 4: Send to pharmacy...");
      await pharma.connect(distributor).assignPharmacy(
        "MED001", "City Pharmacy", pharmacy.address
      );
      m = await pharma.getMedicine("MED001");
      expect(m.currentStatus).to.equal(3);
      console.log("         Status:", statusName(3));

      console.log("      💊 Step 5: Mark available at pharmacy...");
      await pharma.connect(pharmacy).markAvailableAtPharmacy("MED001");
      m = await pharma.getMedicine("MED001");
      expect(m.currentStatus).to.equal(4);
      console.log("         Status:", statusName(4));

      console.log("      💰 Step 6: Sell medicine...");
      await pharma.connect(pharmacy).sellMedicine("MED001");
      m = await pharma.getMedicine("MED001");
      expect(m.currentStatus).to.equal(5);
      console.log("         Status:", statusName(5));

      console.log("      🎉 Full supply chain completed successfully!");
    });

  });

  // ════════════════════════════════════════════════════════
  // TEST 6: Medicine Count
  // ════════════════════════════════════════════════════════
  describe("6. Medicine Count", function () {

    it("should return correct medicine count", async function () {
      await pharma.connect(manufacturer).addMedicine("MED001","A","B","D","E","F");
      await pharma.connect(manufacturer).addMedicine("MED002","A","B","D","E","F");
      await pharma.connect(manufacturer).addMedicine("MED003","A","B","D","E","F");

      const count = await pharma.getMedicineCount();
      expect(count).to.equal(3);
      console.log("      ✅ Medicine count:", count.toString());
    });

    it("should return all medicine IDs", async function () {
      await pharma.connect(manufacturer).addMedicine("MED001","A","B","D","E","F");
      await pharma.connect(manufacturer).addMedicine("MED002","A","B","D","E","F");

      const ids = await pharma.getAllMedicineIds();
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal("MED001");
      expect(ids[1]).to.equal("MED002");
      console.log("      ✅ All IDs returned:", ids);
    });

  });

  // ── Helper functions ───────────────────────────────────
  function truncate(addr) {
    return addr.slice(0,6) + "..." + addr.slice(-4);
  }

  function statusName(n) {
    const names = ["Manufactured","ShippedToDistributor","ReceivedByDistributor","SentToPharmacy","AvailableAtPharmacy","Sold"];
    return names[n];
  }

  async function getTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + 1;
  }

});
