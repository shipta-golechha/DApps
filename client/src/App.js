import React, { Component } from "react";
import Dweet from "./contracts/Dweet.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";

import 'typeface-roboto';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import TextField from '@material-ui/core/TextField';
import Icon from '@material-ui/core/Icon';

import "./App.css";
import { runInThisContext } from "vm";

const styles = {
  root: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    paddingTop: 50,
    paddingLeft: '15%',
    paddingRight: '15%',
  },
  grow: {
    flexGrow: 1,
  },
  paper: {
    padding: 20,
    textAlign: 'center',
    color: 'black',
  }, 
  post: {
    padding: 20,
    marginBottom: 20,
  },
  username: {
    flexGrow: 1,
    color: '#3F51B5',
    fontWeight: 'bold'
  },
  postDescription: {
    marginTop: 5,
    flexGrow: 1,
  },
  description: {
    flexGrow: 1,
    marginBottom: 10,
  },
  avatar: {
    margin: 20,
    width: 70,
    height: 70,
    fontSize: 35,
  },
  row: {
    display: 'flex',
    justifyContent: 'center',
  },
  textField: {
    marginLeft: 0,
    marginRight: 0,
  },
  button: {
    margin: 10,
  },
  rightIcon: {
    marginLeft: 20,
  },
};

class App extends Component {
  state = { web3: null, accounts: null, contract: null, loggedIn: false, user: null, invalidUser: false,
  screen: 'login', dweet: '', userDescription: '', userUsername: '', userImage: '', dweets: [] };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const Contract = truffleContract(Dweet);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      await this.setState({ web3, accounts, contract: instance });

      this.waitForDweets();
    } 
    catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  loginUser = async () => {
    const { accounts, contract } = this.state;
    try {
      const usernameHash = await contract.owners.call(accounts[0]);
      if (usernameHash != 0) {
        let user = await contract.users.call(usernameHash);
        let screen = 'mainApp';
        this.setState({ loggedIn: true, user, screen });
      }
      else {
        this.setState({ invalidUser: true });
      }
    }
    catch (error) {}
  };

  logoutUser = async () => {
    let screen = 'login';
    this.setState({ loggedIn: false, user: null, screen });
  }

  createAccount = async (username, description) => {
    const { accounts, contract } = this.state;
    try {
      await contract.createAccount(username, description, { from: accounts[0] });
    }
    catch (error) {}
  };

  handleClickOpen = () => {
    this.setState({ invalidUser: true });
  };

  handleClose = () => {
    this.setState({ invalidUser: false });
  };

  handleCloseCreateAccount = () => {
    this.setState({ invalidUser: false, screen: 'createAccount' });
  };

  publishDweet = async () => {
    if (this.state.dweet != '') {
      const { accounts, contract } = this.state;
      await contract.tweet(this.state.dweet, { from: accounts[0] });
      this.setState({ dweet: '' });
    }
  };

  createAccount = async () => {
    if (this.state.userUsername != '' && this.state.userDescription != '') {
      const { web3, accounts, contract, userUsername, userDescription } = this.state;
      const usernameHash = web3.utils.keccak256(userUsername);
      const status = await contract.userExists(usernameHash, { from: accounts[0] });
      if (!status) {
        await contract.createAccount(userUsername, userDescription, { from: accounts[0] });
        this.setState({ screen: 'login', userUsername: '', userDescription: '' }, this.loginUser);
      }
      else {
        /**
         * TODO:
         * - error when user exists
         */
      }
    }
    else {}
  };

  updateAccount = async () => {
    if (this.state.userDescription != '') {
      const { web3, accounts, contract, userImage, userDescription, user } = this.state;
      const usernameHash = web3.utils.keccak256(user[1]);
      await contract.editAccount(usernameHash, userDescription, userImage, { from: accounts[0] });
      this.setState({ screen: 'mainApp', userDescription: '' }, this.loginUser);
    }
    else {}
  };

  waitForDweets = async () => {
    const { contract, dweets } = this.state;

    contract.NewTweet({}, async (err, event) => {
      let dweet = event.returnValues.tweet;
      let usernameHash = event.returnValues.from;

      let user = await contract.users.call(usernameHash);
      dweets.push([ user[1], dweet, usernameHash ]);
      this.setState({ dweets });
    });
  }

  render() {
    let username = [], description = [];
    if (this.state.user) {
      username = this.state.user[1];
      description = this.state.user[2];
    }

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    
    let posts = [];
    for (var i = 0; i < this.state.dweets.length; i++) {
      posts.push(
        <Paper style={styles.post}>
          <div style={styles.row}>
            <Typography variant="h6" color="inherit" style={styles.username}>
              @{this.state.dweets[i][0]}
            </Typography>
          </div>
          <div style={styles.row}>
            <Typography variant="body1" color="inherit" style={styles.postDescription}>
              {this.state.dweets[i][1]}
            </Typography>
          </div>
        </Paper>
      );
    }

    let invalidUserDialog = (
      <Dialog
        open={this.state.invalidUser}
        onClose={this.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Create a new account?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            We could not find an account linked to your address {this.state.accounts[0]}. Do you want to create a new account in Dweet?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleCloseCreateAccount} color="primary" autoFocus>
            Yes
          </Button>
          <Button onClick={this.handleClose} color="primary">
            No
          </Button>
        </DialogActions>
      </Dialog>
    );
    
    let mainAppScreen = (<div style={styles.container}>
      <Grid container spacing={24}>
        <Grid item xs={6}>
          <Paper style={styles.paper}>
            <div style={styles.row}>
              <Avatar style={styles.avatar}>{username[0]}</Avatar>
            </div>
            <Typography variant="h4" color="inherit" style={styles.username}>
              @{username}
            </Typography>
            <Typography variant="h6" color="inherit" style={styles.description}>
              {description}
            </Typography>
            <TextField
              id="outlined-multiline-static"
              label="Dweet"
              multiline
              rows="4"
              placeholder="Enter your dweet here..."
              style={styles.textField}
              margin="normal"
              variant="outlined"
              fullWidth
              onChange={e => this.setState({ dweet: e.target.value })}
              value={this.state.dweet}
            />
            <Button variant="contained" color="primary" style={styles.button}
              onClick={this.publishDweet}>
              Publish
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          {posts}
        </Grid>
      </Grid>
    </div>);
    
    let loginScreen = (<div style={styles.container}>
      <Typography variant="h1" component="h3" style={{paddingBottom: 10}}>
        Welcome to <span style={styles.username}>Dweet</span>!
      </Typography>
      <Typography component="p" style={{fontSize: 25}}>
        Decentralized Twitter as an Assignment in the course Distributing Trust and Blockchain, written in Solidity by Shipta, Himanshi, Tejus and Sounak.
      </Typography>
      <Typography component="p" style={{fontSize: 25}}>
        Check out the code on <a href="https://github.com/shipta-golechha/DApps">GitHub</a>!
      </Typography>
    </div>);
    
    let editProfileScreen = (<div style={styles.container}>
      <div style={styles.row}>
      <Paper style={styles.paper}>
        <Typography variant="h4" color="inherit" style={styles.username}>
          Edit Profile
        </Typography>
        <TextField
          id="outlined-multiline-static"
          label="Profile Picture URL"
          style={styles.textField}
          margin="normal"
          variant="outlined"
          fullWidth
          onChange={e => this.setState({ userImage: e.target.value })}
          value={this.state.userImage}
        />
        <TextField
          id="outlined-multiline-static"
          label="Description"
          multiline
          rows="4"
          placeholder="Enter your description here..."
          style={styles.textField}
          margin="normal"
          variant="outlined"
          fullWidth
          onChange={e => this.setState({ userDescription: e.target.value })}
          value={this.state.userDescription}
        />
        <Button variant="contained" color="primary" style={styles.button}
          onClick={this.updateAccount}>
          Update
        </Button>
      </Paper>
      </div>
    </div>);
    
    let createAccountScreen = (<div style={styles.container}>
      <div style={styles.row}>
      <Paper style={styles.paper}>
        <Typography variant="h4" color="inherit" style={styles.username}>
          Register
        </Typography>
        <TextField
          id="outlined-multiline-static"
          label="Username"
          placeholder="Enter your handle name here..."
          style={styles.textField}
          margin="normal"
          variant="outlined"
          fullWidth
          onChange={e => this.setState({ userUsername: e.target.value })}
          value={this.state.userUsername}
        />
        <TextField
          id="outlined-multiline-static"
          label="Description"
          multiline
          rows="4"
          placeholder="Enter your description here..."
          style={styles.textField}
          margin="normal"
          variant="outlined"
          fullWidth
          onChange={e => this.setState({ userDescription: e.target.value })}
          value={this.state.userDescription}
        />
        <Button variant="contained" color="primary" style={styles.button}
          onClick={this.createAccount}>
          Register
        </Button>
      </Paper>
      </div>
    </div>);
    
    let screen;

    switch (this.state.screen) {
      case 'mainApp':
        screen = mainAppScreen;
        break;
      default:
      case 'login':
        screen = loginScreen;
        break;
      case 'editProfile':
        screen = editProfileScreen;
        break;
      case 'createAccount':
        screen = createAccountScreen;
        break;
    }

    return (
      <div>
        <div style={styles.root}>
          <AppBar position="sticky" color="primary">
            <Toolbar>
              <Typography variant="h6" color="inherit" style={styles.grow}>
                Dweet
              </Typography>
              {this.state.loggedIn ? (
                <div>
                  {this.state.screen == 'mainApp' ? (
                    <Button color="inherit" onClick={() => this.setState({ screen: 'editProfile' })} style={{marginRight: 5}}>Edit</Button>
                  ) : (
                    <Button color="inherit" onClick={() => this.setState({ screen: 'mainApp' })} style={{marginRight: 5}}>Home</Button>
                  )}
                  <Button color="inherit" onClick={this.logoutUser}>Logout</Button>
                </div>
              ) : (
                <Button color="inherit" onClick={this.loginUser}>Login</Button>
              )}
            </Toolbar>
          </AppBar>
        </div>
        {screen}
        {invalidUserDialog}
      </div>
    );
  }
}

export default App;
