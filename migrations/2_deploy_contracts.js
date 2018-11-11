var Dweet = artifacts.require("./Dweet.sol");

module.exports = function(deployer) {
  deployer.deploy(Dweet);
};
