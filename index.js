import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js"
import { parseEther } from "https://cdn.jsdelivr.net/npm/ethers@6.7.0/dist/ethers.min.js"
import { abi, contractAddress } from "./constants.js"
const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")

connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw

console.log(ethers, "ethers...")
console.log(parseEther, "parseEther...")

async function connect(params) {
    if (typeof window.ethereum !== "undefined") {
        // 链接上matamask
        await window.ethereum.request({
            method: "eth_requestAccounts",
            params: [],
        })
        connectButton.innerHTML = "Connected!"
    } else {
        fundButton.innerHTML = "Please install metamask!"
    }
}
async function getBalance(params) {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum) // 使用 BrowserProvider

        const balance = await provider.getBalance(contractAddress) // 获取指定地址的余额，返回一个以 wei 为单位的 BigNumber 对象。
        // console.log(ethers.utils.formatEther(balance))
        console.log(ethers.formatEther(balance)) //将这个 BigNumber 对象转换为以太币的字符串表示形式。
    }
}

async function fund() {
    const ethAmount = document.getElementById("ethAmount").value
    console.log(`Funding with ${ethAmount}...`)
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum) // 使用 BrowserProvider
        await provider.send("eth_requestAccounts", []) // 请求账户访问
        const signer = await provider.getSigner() // 获取签名者
        console.log(signer, "signer")
        const contract = new ethers.Contract(contractAddress, abi, signer) // 创建合约对象
        console.log(contract, "contract")
        try {
            // 使用合约的 fund 方法
            const transactionResponse = await contract.fund({
                value: parseEther(ethAmount),
            })
            // 嘿，监听这个交易完成
            await listenForTransactionMine(transactionResponse, provider)
            console.log("Done!")
        } catch (error) {
            console.log(error)
        }
    }
}
async function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining${transactionResponse.hash}`)
    return new Promise((resolve, reject) => {
        //一旦这个交易的hash值被找到; provider.once(transactionResponse.hash,我们就调用这个函数
        provider.once(transactionResponse.hash, async (transactionReceipt) => {
            // const confirmations =
            //     (await provider.getBlockNumber()) -
            //     transactionReceipt.blockNumber +
            //     1
            // console.log(`Completed with ${confirmations} confirmations`)
            // resolve() // resolve()这个函数，只有在once(transactionResponse.hash被找到时才会完成
            // 并且只有provider 找到了这个交易的哈希值和回执后，我们才解析Promise

            try {
                // 添加一个延迟，确保有足够的时间生成新的区块
                setTimeout(async () => {
                    const currentBlockNumber = await provider.getBlockNumber()
                    const confirmations =
                        currentBlockNumber - transactionReceipt.blockNumber + 1
                    console.log(`Completed with ${confirmations} confirmations`)
                    resolve()
                }, 1000) // 延迟1秒
            } catch (error) {
                console.log(error)
                reject(error)
            }
        })
        // 因此，这个Prominse只有在resolve reject被调用后才会返回
    })
    // 我们要返回Promise的原因是，我们需要创建一个用于区块链的监听器
    // 监听这个交易完成（ethers其实为我们提供了一种监听交易和事件的方法）

    // const receipt = await provider.waitForTransaction(transactionResponse.hash)
    // const confirmations =
    //     (await provider.getBlockNumber()) - receipt.blockNumber + 1
    // console.log(`Transaction confirmed with ${confirmations} confirmations`)
}
// 提款
async function withdraw(params) {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum) // 使用 BrowserProvider
        const signer = await provider.getSigner() // 获取签名者
        const contract = new ethers.Contract(contractAddress, abi, signer) // 创建合约对象
        try {
            const transactionResponse = await contract.withdraw()
            await listenForTransactionMine(transactionResponse, provider)
        } catch (error) {
            console.log(error)
        }
    }
}
