import './App.css';
import { Contract, ethers, formatEther, parseEther } from 'ethers';
import { useState, useEffect } from "react";
import contractABI from "./contractABI";
import tokenContractABI from "./tokenContractABI";

function App() {

  const [account, setAccount] = useState();
  const [balance, setBalance] = useState();
  const [contract, setContract] = useState();
  const [inputValue, setInputValue] = useState();
  const [tokenContract, setTokenContract] = useState();
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [arrowClass, setArrowClass] = useState("arrow");
  const [status, setStatus] = useState();

  const contractAddress = "0x1c4f87766Ae322A5c9Ccbd8FDa1774a1c63C8f34";
  const tokenContractAddress = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844";

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  }

  const toggleTable = () => {
    setShowTable(!showTable);
    if (!showTable) {
      setArrowClass("arrow active");
    } else {
      setArrowClass("arrow");
    }
  }

  useEffect(() => {
    let signer = null;
    let provider;

    async function loadAccounts() {
      try {

        if (window.ethereum == null) {
          console.log("MetaMask not installed: using read-only defaults.");
          provider = ethers.getDefaultProvider();
        }
        else {
          provider = new ethers.BrowserProvider(window.ethereum);
          signer = await provider.getSigner();
          setAccount(signer.address);
          let bal = await provider.getBalance(account);
          setBalance(formatEther(bal));
          setContract(new Contract(contractAddress, contractABI, signer));
          setTokenContract(new Contract(tokenContractAddress, tokenContractABI, signer));
        }
      } catch (error) {
        console.log("Loading accounts failed: ", error);
      }
    }

    loadAccounts();
  }, [account, balance]);

  useEffect(() => {
    const storedTransactionDetails = JSON.parse(localStorage.getItem("transactionDetails"));
    if (storedTransactionDetails) {
      setTransactionDetails(storedTransactionDetails);
    }
  }, []);

  const addTransactionDetails = (tx) => {
    const updatedTransaction = [...transactionDetails, tx];
    setTransactionDetails(updatedTransaction);
    localStorage.setItem("transactionDetails", JSON.stringify(updatedTransaction));
  };

  const swapETHToTokens = async (amount) => {
    try {
      const swap = await contract.swapFromETHToTokens((amount), { value: amount });
      console.log("Waiting for the transaction to complete...");
      setStatus(false);
      const tx = await swap.wait();
      addTransactionDetails({
        type: "ETH To DAI",
        value: `${formatEther(amount)} ETH`,
        from: tx.from,
        hash: tx.hash,
        time: new Date().toLocaleString()
      });
      setStatus(true);
      console.log("Transaction successful:", tx);
    } catch (error) {
      console.log("Transaction failed:", error);
    }
  }

  const swapTokensToETH = async (amount) => {
    try {
      await approveTokens(amount);
      const swap = await contract.swapTokensForETH(amount);
      console.log("Waiting for the transaction to complete...");
      setStatus(false);
      const tx = await swap.wait();
      addTransactionDetails({
        type: "DAI To ETH",
        value: `${formatEther(amount)} DAI`,
        from: tx.from,
        hash: tx.hash,
        time: new Date().toLocaleString()
      });
      setStatus(true);
      console.log("Transaction successful:", tx);
    } catch (error) {
      console.log("Transaction failed:", error);
    }
  }

  const approveTokens = async (amount) => {
    const approval = await tokenContract.approve(contractAddress, amount);
    approval.wait();
    console.log("Approval done!");
  }


  // const txDetails = () => {
  //   console.log(transactionDetails);
  // }

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h1>S.A.T SWAP</h1>
        </div>
        <div className='accountInfo'>
          <p>Connected through account : <b>{account}</b></p>
          <p>With Balance : <b>{balance} ETH</b></p>
        </div>
        <div>
          {status === false ? <div class="lds-ripple"><div></div><div></div></div> : null}
        </div>
      </header>
      <div className="token">
        <input type="number" id="token-input" value={inputValue} onChange={handleInputChange} placeholder="Amount of Tokens"></input>
      </div>
      <div className="container">
        <button className="btn" onClick={() => { swapETHToTokens(parseEther(inputValue)) }}>Swap From ETH to DAI</button>
        <button className="btn" onClick={() => { swapTokensToETH(parseEther(inputValue)) }}>Swap from DAI to ETH</button>
      </div>
      <hr />
      {transactionDetails.length > 0 ?
        <div className="transactionDetails">
          <div className="button-container">
            <button onClick={toggleTable} className={arrowClass}>Transaction Details</button>
          </div>
          {showTable && (
            <table className='table'>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>From</th>
                  <th>Hash</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {transactionDetails.map((tx, index) => (
                  <tr key={index}>
                    <td>{tx.type}</td>
                    <td>{tx.value}</td>
                    <td>{tx.from}</td>
                    <td><a href={`https://goerli.etherscan.io/tx/${tx.hash}`} target="_blank" rel='noreferrer' style={{ color: '#2de2e6', textDecoration: 'underline' }}>{tx.hash}</a></td>
                    <td>{tx.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        : <h2>No Transactions Yet</h2>}
        <div className="Copyright">Copyright 2023 S.A.T SWAP. All rights Reserved.</div>
        {/* <div>
          {inputValue > balance ? alert("Insufficient Fund!!") : null}
        </div> */}
      {/* <button onClick={txDetails}>Tx Details</button> */}
    </div>
  );
}

export default App;
