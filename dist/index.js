"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
if (process.env.NODE_ENV == 'production')
    app.set('views', path_1.default.join(__dirname, '../views'));
else
    app.set('views', path_1.default.join(__dirname, './views'));
// Take a port 3000 for running server.
const port = 3000;
function getURL(url) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            let data = [];
            https_1.default.get(url, res => {
                res.on('data', chunk => {
                    data.push(chunk);
                });
                res.on('end', () => {
                    resolve(JSON.parse(Buffer.concat(data).toString()));
                });
            });
        });
    });
}
// Handling '/' Request
app.get('/', (_req, _res) => {
    let url = "https://api-archive.mainnet.desmos.network/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=150";
    https_1.default.get(url, res => {
        let data = [];
        res.on('data', chunk => {
            data.push(chunk);
        });
        res.on('end', () => __awaiter(void 0, void 0, void 0, function* () {
            console.log('Response validators ended: ');
            const validatorsData = JSON.parse(Buffer.concat(data).toString()).validators;
            let totalUnbonding = 0;
            for (let i in validatorsData) {
                // validators.push(validatorsData[i].operator_address);
                url = `https://api-archive.mainnet.desmos.network/cosmos/staking/v1beta1/validators/${validatorsData[i].operator_address}/unbonding_delegations`;
                let data = yield getURL(url);
                if ((data === null || data === void 0 ? void 0 : data.unbonding_responses.length) > 0) {
                    for (let j in data === null || data === void 0 ? void 0 : data.unbonding_responses) {
                        let balances = 0;
                        for (let k in data === null || data === void 0 ? void 0 : data.unbonding_responses[j].entries) {
                            // console.log(unbondingResponses[j].entries[k]);
                            balances += parseInt(data === null || data === void 0 ? void 0 : data.unbonding_responses[j].entries[k].balance);
                        }
                        totalUnbonding += balances;
                    }
                }
            }
            // console.log(totalUnbonding);
            url = "https://api-archive.mainnet.desmos.network/cosmos/tx/v1beta1/txs?events=message.action='/cosmos.staking.v1beta1.MsgUndelegate'&order_by=2&limit=100";
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
                    _res.render('index', { unbondings: unbondings, total: (0, numeral_1.default)(total).format('0,0.000000'), totalUnbonding: (0, numeral_1.default)(totalUnbonding / 1000000).format('0,0.000000') });
                    console.log('Done 🎉');
                });
            }).on('error', err => {
                console.log('Error: ', err.message);
            });
        }));
    });
});
// Server setup
app.listen(port, () => {
    console.log(`TypeScript with Express 
         http://localhost:${port}/`);
});
//# sourceMappingURL=index.js.map