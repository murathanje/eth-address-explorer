const axios = require('axios');
const NodeCache = require('node-cache');

class EtherscanService {
    constructor() {
        this.ETHERSCAN_API_URL = "https://api.etherscan.io/api";
        this.ethPriceCache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
        this.transactionCache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
    }

    async getEthPrice(apiKey) {
        const cachedPrice = this.ethPriceCache.get('eth_price');
        if (cachedPrice) return cachedPrice;

        try {
            const response = await axios.get(`${this.ETHERSCAN_API_URL}?module=stats&action=ethprice&apikey=${apiKey}`);
            if (response.data.status === '1') {
                const price = parseFloat(response.data.result.ethusd);
                this.ethPriceCache.set('eth_price', price);
                return price;
            }
        } catch (error) {
            console.error('Error fetching ETH price:', error);
        }

        return 2000; // Default fallback price
    }

    async fetchTransactions(address, apiKey) {
        const cacheKey = address.toLowerCase();
        const cachedData = this.transactionCache.get(cacheKey);
        if (cachedData) return cachedData;

        const result = {
            normal_transactions: [],
            internal_transactions: [],
            normal_summary: { total_eth_in: 0, total_eth_out: 0, total_transactions: 0 },
            internal_summary: { total_eth_in: 0, total_eth_out: 0, total_transactions: 0 }
        };

        // Fetch current balance
        try {
            const balanceResponse = await axios.get(`${this.ETHERSCAN_API_URL}?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`);
            if (balanceResponse.data.status === '1') {
                result.current_balance = parseFloat(balanceResponse.data.result) / 1e18;
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            result.current_balance = 0;
        }

        // Fetch normal transactions
        await this.fetchPaginatedTransactions(
            address, 
            'txlist', 
            result.normal_transactions, 
            result.normal_summary, 
            apiKey
        );

        // Fetch internal transactions
        await this.fetchPaginatedTransactions(
            address, 
            'txlistinternal', 
            result.internal_transactions, 
            result.internal_summary, 
            apiKey
        );

        this.transactionCache.set(cacheKey, result);
        return result;
    }

    async fetchPaginatedTransactions(address, action, transactionList, summary, apiKey) {
        let page = 1;
        while (true) {
            try {
                const response = await axios.get(`${this.ETHERSCAN_API_URL}?module=account&action=${action}&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=10000&sort=desc&apikey=${apiKey}`);
                
                if (response.data.status === '1' && response.data.result) {
                    const transactions = response.data.result;
                    transactionList.push(...transactions);

                    transactions.forEach(tx => {
                        const value = parseFloat(tx.value) / 1e18;
                        if (tx.from.toLowerCase() === address.toLowerCase()) {
                            summary.total_eth_out += value;
                        }
                        if (tx.to.toLowerCase() === address.toLowerCase()) {
                            summary.total_eth_in += value;
                        }
                    });

                    summary.total_transactions = transactionList.length;

                    if (transactions.length < 10000) break;
                    page++;
                } else {
                    break;
                }
            } catch (error) {
                console.error(`Error fetching ${action} transactions:`, error);
                break;
            }
        }
    }

    analyzeAddressTransactions(address, txData) {
        const connections = {};

        const processTransaction = (tx) => {
            const txValue = parseFloat(tx.value) / 1e18;
            const txTimestamp = parseInt(tx.timeStamp);

            const processAddr = (fromAddr, toAddr) => {
                const counterparty = fromAddr.toLowerCase() === address.toLowerCase() ? toAddr : fromAddr;
                const isOutgoing = fromAddr.toLowerCase() === address.toLowerCase();

                if (!connections[counterparty]) {
                    connections[counterparty] = {
                        address: counterparty,
                        sent: 0,
                        received: 0,
                        count: 0,
                        dates: []
                    };
                }

                if (isOutgoing) {
                    connections[counterparty].sent += txValue;
                } else {
                    connections[counterparty].received += txValue;
                }
                connections[counterparty].count++;
                connections[counterparty].dates.push(txTimestamp);
            };

            processAddr(tx.from, tx.to);
        };

        txData.normal_transactions.forEach(processTransaction);
        txData.internal_transactions.forEach(processTransaction);

        const connectionsList = Object.values(connections).map(conn => {
            conn.dates.sort((a, b) => b - a);
            conn.lastInteraction = conn.dates[0] || 0;
            return conn;
        }).sort((a, b) => (b.sent + b.received) - (a.sent + a.received));

        const totalEthIn = txData.normal_summary.total_eth_in + txData.internal_summary.total_eth_in;
        const totalEthOut = txData.normal_summary.total_eth_out + txData.internal_summary.total_eth_out;
        const totalTransactions = txData.normal_summary.total_transactions + txData.internal_summary.total_transactions;

        return {
            connections: connectionsList,
            total_eth_sent: totalEthOut,
            total_eth_received: totalEthIn,
            net_position: txData.current_balance || 0,
            total_transactions: totalTransactions,
            normal_summary: txData.normal_summary,
            internal_summary: txData.internal_summary,
            normal_transactions: txData.normal_transactions,
            internal_transactions: txData.internal_transactions
        };
    }
}

module.exports = new EtherscanService(); 