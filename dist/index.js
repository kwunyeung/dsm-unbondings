"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import the express in typescript file
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const numeral_1 = __importDefault(require("numeral"));
const path_1 = __importDefault(require("path"));
// Initialize the express engine
const app = (0, express_1.default)();
app.set('view engine', 'pug');
app.set('views', path_1.default.join(__dirname, 'views'));
// Take a port 3000 for running server.
const port = 3000;
// Handling '/' Request
app.get('/', (_req, _res) => {
    // _res.send("TypeScript With Express");
    const url = "https://api.mainnet.desmos.network/cosmos/tx/v1beta1/txs?events=message.action='/cosmos.staking.v1beta1.MsgUndelegate'&order_by=2&limit=100";
    https_1.default.get(url, res => {
        let data = [];
        res.on('data', chunk => {
            data.push(chunk);
        });
        res.on('end', () => {
            console.log('Response ended: ');
            const unbonding = JSON.parse(Buffer.concat(data).toString()).txs;
            let delegators = [];
            let total = 0;
            for (let i in unbonding) {
                let tx = unbonding[i];
                for (let j in tx.body.messages) {
                    // console.log(tx.body.messages[j]['@type'])
                    if (tx.body.messages[j]['@type'] == '/cosmos.staking.v1beta1.MsgUndelegate') {
                        if (delegators[tx.body.messages[j].delegator_address]) {
                            delegators[tx.body.messages[j].delegator_address] += parseInt(tx.body.messages[j].amount.amount);
                        }
                        else {
                            delegators[tx.body.messages[j].delegator_address] = parseInt(tx.body.messages[j].amount.amount);
                        }
                        total += parseInt(tx.body.messages[j].amount.amount);
                        // console.log('haha');
                    }
                }
            }
            let unbondings = new Array();
            for (let i in delegators) {
                unbondings.push({ address: i, amount: (0, numeral_1.default)(delegators[i] / 1000000).format('0,0.000000') });
            }
            total = total / 1000000;
            _res.render('index', { unbondings: unbondings, total: (0, numeral_1.default)(total).format('0,0.000000') });
        });
    }).on('error', err => {
        console.log('Error: ', err.message);
    });
});
// Server setup
app.listen(port, () => {
    console.log(`TypeScript with Express 
         http://localhost:${port}/`);
});
//# sourceMappingURL=index.js.map