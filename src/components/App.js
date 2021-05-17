import React, { Component } from "react";
import Web3 from "web3";
import Identicon from "identicon.js";
import "./App.css";
import Decentragram from "../abis/Decentragram.json";
import Navbar from "./Navbar";
import Main from "./Main";

const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
}); // Estos argumentos son los predeterminados si se deja vacío.

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockChainData();
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Buscador que no soporta ethereum detectado. Porfavor instale Metamask para proseguir."
      );
    }
  }

  async loadBlockChainData() {
    const web3 = window.web3;
    // Cargar cuenta
    const accounts = await web3.eth.getAccounts();
    console.log(accounts[0]);
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();
    const networkData = Decentragram.networks[networkId];
    if (!networkData) {
      window.alert(
        "El contrato de Decentragram no está desplegado en la red detectada."
      );
    }
    const decentragram = web3.eth.Contract(
      Decentragram.abi,
      networkData.address
    );
    this.setState({ decentragram });
    const imagesCount = await decentragram.methods.imageCount().call();
    this.setState({ imagesCount });

    for (var i = 1; i <= imagesCount; i++) {
      const image = await decentragram.methods.images(i).call();
      this.setState({
        images: [...this.state.images, image],
      });
    }

    this.setState({ loading: false });
  }

  captureFile = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });
      console.log("buffer: ", this.state.buffer);
    };
  };

  uploadImage = (description) => {
    console.log("Subiendo archivo a ipfs...");
    ipfs.add(this.state.buffer, (error, result) => {
      if (error) {
        console.error(error);
        return;
      }

      this.setState({ loading: true });
      this.state.decentragram.methods
        .uploadImage(result[0].hash, description)
        .send({ from: this.state.account })
        .on("transactionHash", (hash) => {
          this.setState({ loading: false });
        });
    });
  };

  tipImageOwner = (id, tipAmount) => {
    this.setState({ loading: true });
    this.state.decentragram.methods
      .tipImageOwner(id)
      .send({ from: this.state.account, value: tipAmount })
      .on("transactionHash", (hash) => {
        this.setState({ loading: false });
      });
  };

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      decentragram: null,
      images: [],
      loading: true,
    };
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        {this.state.loading ? (
          <div id="loader" className="text-center mt-5">
            <p>Loading...</p>
          </div>
        ) : (
          <Main
            images={this.state.images}
            captureFile={this.captureFile}
            uploadImage={this.uploadImage}
            tipImageOwner={this.tipImageOwner}
          />
        )}
      </div>
    );
  }
}

export default App;
