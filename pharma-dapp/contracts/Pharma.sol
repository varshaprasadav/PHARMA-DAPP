// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Pharma {
    enum Status { Manufactured, ShippedToDistributor, ReceivedByDistributor, SentToPharmacy, AvailableAtPharmacy, Sold }

    struct Medicine {
        string medicineId;
        string name;
        string batchNumber;
        string manufacturingDate;
        string expiryDate;
        string manufacturerName;
        string distributorName;
        string pharmacyName;
        address currentOwner;
        Status currentStatus;
        uint256 timestamp;
    }

    mapping(string => Medicine) public medicines;
    string[] public medicineIds;

    event MedicineAdded(string medicineId, string name, address owner, uint256 timestamp);
    event DistributorUpdated(string medicineId, string distributorName, address newOwner, uint256 timestamp);
    event PharmacyUpdated(string medicineId, string pharmacyName, address newOwner, uint256 timestamp);
    event OwnershipTransferred(string medicineId, address from, address to, uint256 timestamp);
    event MedicineSold(string medicineId, uint256 timestamp);

    modifier medicineExists(string memory _id) {
        require(bytes(medicines[_id].medicineId).length > 0, "Medicine not found");
        _;
    }

    modifier onlyOwner(string memory _id) {
        require(medicines[_id].currentOwner == msg.sender, "Not the owner");
        _;
    }

    function addMedicine(
        string memory _medicineId,
        string memory _name,
        string memory _batchNumber,
        string memory _manufacturingDate,
        string memory _expiryDate,
        string memory _manufacturerName
    ) public {
        require(bytes(medicines[_medicineId].medicineId).length == 0, "Medicine already exists");

        medicines[_medicineId] = Medicine({
            medicineId: _medicineId,
            name: _name,
            batchNumber: _batchNumber,
            manufacturingDate: _manufacturingDate,
            expiryDate: _expiryDate,
            manufacturerName: _manufacturerName,
            distributorName: "",
            pharmacyName: "",
            currentOwner: msg.sender,
            currentStatus: Status.Manufactured,
            timestamp: block.timestamp
        });

        medicineIds.push(_medicineId);
        emit MedicineAdded(_medicineId, _name, msg.sender, block.timestamp);
    }

    function assignDistributor(
        string memory _medicineId,
        string memory _distributorName,
        address _distributorAddress
    ) public medicineExists(_medicineId) onlyOwner(_medicineId) {
        Medicine storage m = medicines[_medicineId];
        m.distributorName = _distributorName;
        m.currentStatus = Status.ShippedToDistributor;
        address prev = m.currentOwner;
        m.currentOwner = _distributorAddress;
        m.timestamp = block.timestamp;

        emit DistributorUpdated(_medicineId, _distributorName, _distributorAddress, block.timestamp);
        emit OwnershipTransferred(_medicineId, prev, _distributorAddress, block.timestamp);
    }

    function receiveByDistributor(string memory _medicineId) public medicineExists(_medicineId) onlyOwner(_medicineId) {
        medicines[_medicineId].currentStatus = Status.ReceivedByDistributor;
        medicines[_medicineId].timestamp = block.timestamp;
    }

    function assignPharmacy(
        string memory _medicineId,
        string memory _pharmacyName,
        address _pharmacyAddress
    ) public medicineExists(_medicineId) onlyOwner(_medicineId) {
        Medicine storage m = medicines[_medicineId];
        m.pharmacyName = _pharmacyName;
        m.currentStatus = Status.SentToPharmacy;
        address prev = m.currentOwner;
        m.currentOwner = _pharmacyAddress;
        m.timestamp = block.timestamp;

        emit PharmacyUpdated(_medicineId, _pharmacyName, _pharmacyAddress, block.timestamp);
        emit OwnershipTransferred(_medicineId, prev, _pharmacyAddress, block.timestamp);
    }

    function markAvailableAtPharmacy(string memory _medicineId) public medicineExists(_medicineId) onlyOwner(_medicineId) {
        medicines[_medicineId].currentStatus = Status.AvailableAtPharmacy;
        medicines[_medicineId].timestamp = block.timestamp;
    }

    function sellMedicine(string memory _medicineId) public medicineExists(_medicineId) onlyOwner(_medicineId) {
        medicines[_medicineId].currentStatus = Status.Sold;
        medicines[_medicineId].timestamp = block.timestamp;
        emit MedicineSold(_medicineId, block.timestamp);
    }

    function getMedicine(string memory _medicineId) public view returns (Medicine memory) {
        return medicines[_medicineId];
    }

    function getAllMedicineIds() public view returns (string[] memory) {
        return medicineIds;
    }

    function getMedicineCount() public view returns (uint256) {
        return medicineIds.length;
    }
}
