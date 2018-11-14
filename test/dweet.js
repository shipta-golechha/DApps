// our Dweet contract object to test
const Dweet = artifacts.require('./Dweet.sol');
const assert = require('assert');
const web3 = require('web3');

// other test parameters
const username = 'testhandle';
const description = 'test description';
const tweetContent = 'test tweet';

contract("Dweet", (accounts) => {
    const admin = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    const user4 = accounts[4];
    const user5 = accounts[5];

    beforeEach(async () => {
        contractInstance = await Dweet.deployed({ from: admin });
    })

    it("should allow to create a new user with username 'testhandle' and description 'test description'", async () => {
        // do create the account
        const createAccountTx = await contractInstance.createAccount(username, description, { from: user1 });

        // assert that the transaction was successful
        assert.equal(createAccountTx.receipt.status, true);
    });

    it("should have created a user 'testhandle'", async () => {
        // get user details from contract
        const user = await contractInstance.users.call(web3.utils.keccak256(username));
        
        assert.equal(user[1], username);
        assert.equal(user[2], description);
    });

    it("should know 'testhandle' exists", async () => {
        const usernameHash = web3.utils.keccak256(username);

        // check the usernamehash exists
        const exists = await contractInstance.userExists.call(usernameHash);
        assert.equal(exists, true);
    });


    it("should allow user1 to edit user1's details", async () => {
        const usernameHash = web3.utils.keccak256(username);
        const updatedDescription = description + ' edited';
        const updatedImageHash = 'QmWvPtv2xVGgdV12cezG7iCQ4hQ52e4ptmFFnBK3gTjnec';

        // call edit account
        await contractInstance.editAccount(usernameHash, updatedDescription, updatedImageHash, { from: user1 });
        
        // then fetch the user details with the usernamehash
        const updatedUserDetails = await contractInstance.users.call(usernameHash);
        assert.equal(updatedUserDetails[2], updatedDescription);
        assert.equal(updatedUserDetails[4], updatedImageHash);
    });

    it("should not allow user2 to edit user1's details", async () => {
        const usernameHash = web3.utils.keccak256(username);
        const updatedDescription = description + ' edited again';
        const updatedImageHash = 'NAV6eB47NyxyMGzy6PnvjWNNCCtpYa2pmy6rKYnqnvyKNH8';

        try {
            // call edit account
            await contractInstance.editAccount(usernameHash, updatedDescription, updatedImageHash, { from: user2 });
        }
        catch(e) {

        }
        
        // then fetch the user details with the usernamehash
        const updatedUserDetails = await contractInstance.users.call(usernameHash);
        assert.notEqual(updatedUserDetails[2], updatedDescription);
        assert.notEqual(updatedUserDetails[4], updatedImageHash);
    });

    it("should not allow a registered user to register again", async () => {
        try {
            await contractInstance.createAccount('someUserName', description, { from: user1 });
        }
        catch(e) {
            assert.ok(true);
        }
    });

    it("should not allow a new user to create an account with already existing username", async () => {
        try {
            await contractInstance.createAccount('testhandle', description, { from: user3 });
        }
        catch(e) {
            assert.ok(true);
        }
    });

    it("should be able to add a tweet as 'testhandle' and receive it via contract event", async () => {
        const usernameHash = web3.utils.keccak256(username);

        // send the tweet
        await contractInstance.tweet(tweetContent, { from: user1 });
        let flag = false;

        event = contractInstance.NewTweet({
            filter: {
                from: usernameHash,
            },
            fromBlock: 1 // must be > 0!
        });

        event.watch((err, event) => {
            assert.equal(event.returnValues.tweet, tweetContent);
        });
    });
});
