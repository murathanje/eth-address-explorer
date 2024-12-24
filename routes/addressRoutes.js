const express = require('express');
const router = express.Router();
const etherscanService = require('../services/etherscanService');

// Configuration (you should replace with your actual Etherscan API key)
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'YOUR_API_KEY';

router.get('/eth_price', async (req, res) => {
    const { api_key } = req.query;
    
    if (!api_key) {
        return res.status(400).json({ 
            success: false, 
            error: 'API key is required' 
        });
    }

    try {
        const price = await etherscanService.getEthPrice(api_key);
        res.json({
            success: true,
            price: price
        });
    } catch (error) {
        console.error('Error fetching ETH price:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch ETH price' 
        });
    }
});

router.get('/analyze/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { api_key } = req.query;

        // Validate Ethereum address
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid Ethereum address' 
            });
        }

        // Validate API key
        if (!api_key) {
            return res.status(400).json({ 
                success: false,
                error: 'API key is required' 
            });
        }

        // Get ETH price
        const ethPrice = await etherscanService.getEthPrice(api_key);

        // Fetch transactions
        const txData = await etherscanService.fetchTransactions(address, api_key);

        // Analyze transactions
        const analysisResult = etherscanService.analyzeAddressTransactions(address, txData);

        // Add ETH price to the result
        analysisResult.eth_price = ethPrice;

        res.json({
            success: true,
            analysis: analysisResult
        });
    } catch (error) {
        console.error('Error analyzing address:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to analyze address' 
        });
    }
});

module.exports = router; 