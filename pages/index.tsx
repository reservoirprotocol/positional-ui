import { useAddress, useDisconnect, useMetamask, useSigner } from '@thirdweb-dev/react';
import type { NextPage } from 'next';
import { useState } from 'react';
import { splitSignature } from 'ethers/lib/utils';
import { Wallet } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { parseEther } from 'ethers/lib/utils';
import { Contract } from 'ethers';

const Home: NextPage = () => {
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const disconnectWallet = useDisconnect();
  const signer = useSigner();

  const [order, setOrder] = useState();

  const [input, setInput] = useState('');

  return (
    <div>
      {address ? (
        <>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
          <p>Your address: {address}</p>
          <button onClick={async () => {
            if (!signer) {
              return;
            }

            // Build buy order
            const order = {
              asset: "0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78",
              maker: address,
              bps: 8000,
              expiration: Math.floor(Date.now() / 1000) + 3600 * 2,
            };

            // Sign the order
            {
              const { v, r, s } = splitSignature(
                await (signer as any)._signTypedData(
                  {
                    name: "Positional",
                    version: "1",
                    chainId: 4,
                    verifyingContract: "0xf11f9ba71a532d170a2320aeb78596450a892775",
                  },
                  {
                    BuyOrder: [
                      { name: "asset", type: "address" },
                      { name: "maker", type: "address" },
                      { name: "bps", type: "uint256" },
                      { name: "expiration", type: "uint256" },
                    ],
                  },
                  order
                )
              );
              (order as any).v = v;
              (order as any).r = r;
              (order as any).s = s;
            }

            setOrder(order as any);
          }}>Create order (80% below Loot floor)</button>
          {order && 
            <div>{JSON.stringify(order, null, 2)}</div>
          }

          <div>
            <label>Input order:</label>
            <input value={input} onInput={e => setInput((e.target as any).value)}/>
            <button onClick={async () => {
              const order = JSON.parse(input);

              const stats = await fetch("https://api-rinkeby.reservoir.tools/stats/v1?collection=0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78");
              const data = await stats.json();
              const price = data.stats.market.floorAsk.price;
              console.log(price);

              const wallet = new Wallet("0xb462d0f6b721a754f0c8dec882fcd58119d8fbc78ed0ba9ba9857567f9b55e93");

              const packet = {
                request: "0x00000000000000000000000079e2d470f950f2cf78eef41720e8ff2cf4b3cd78",
                deadline: Math.floor(Date.now() / 1000) + 3600 * 2,
                payload: defaultAbiCoder.encode(["uint256"], [parseEther(price.toString())]),
              };
          
              {
                const { v, r, s } = splitSignature(
                  await (wallet as any)._signTypedData(
                    {
                      name: "Positional",
                      version: "1",
                      chainId: 4,
                      verifyingContract: "0xf11f9ba71a532d170a2320aeb78596450a892775",
                    },
                    {
                      VerifyPacket: [
                        { name: "request", type: "bytes32" },
                        { name: "deadline", type: "uint256" },
                        { name: "payload", type: "bytes" },
                      ],
                    },
                    packet
                  )
                );
                (packet as any).v = v;
                (packet as any).r = r;
                (packet as any).s = s;
              }

              const exchange = new Contract("0xf11f9ba71a532d170a2320aeb78596450a892775", abi);
              await exchange.connect(signer!).fillOrder(order, packet, 6500);
            }}>Fill</button>
          </div>
        </>
      ) : (
        <button onClick={connectWithMetamask}>Connect with Metamask</button>
      )}
    </div>
  );
};

export default Home;

const abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_relayer",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "InvalidNft",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Trustus__InvalidPacket",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "id",
        "type": "bytes32"
      }
    ],
    "name": "BuyOrderCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "id",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "asset",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "maker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "taker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "BuyOrderFilled",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BUY_ORDER_TYPEHASH",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DOMAIN_SEPARATOR",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "asset",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "maker",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "bps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiration",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "v",
            "type": "uint8"
          },
          {
            "internalType": "bytes32",
            "name": "r",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "s",
            "type": "bytes32"
          }
        ],
        "internalType": "struct PositionalV1.BuyOrder",
        "name": "order",
        "type": "tuple"
      }
    ],
    "name": "cancelOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "cancelledOrFilled",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "asset",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "maker",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "bps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiration",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "v",
            "type": "uint8"
          },
          {
            "internalType": "bytes32",
            "name": "r",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "s",
            "type": "bytes32"
          }
        ],
        "internalType": "struct PositionalV1.BuyOrder",
        "name": "order",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "v",
            "type": "uint8"
          },
          {
            "internalType": "bytes32",
            "name": "r",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "s",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "request",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "deadline",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "payload",
            "type": "bytes"
          }
        ],
        "internalType": "struct Trustus.TrustusPacket",
        "name": "packet",
        "type": "tuple"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "fillOrder",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "weth",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];