
// Import the express in typescript file
import express from 'express';
import https from 'https';
import numeral from 'numeral';
import path from 'path';

// Initialize the express engine
const app: express.Application = express();
app.set('view engine', 'pug');
if (process.env.NODE_ENV == 'production')
    app.set('views', path.join(__dirname, '../views'));
else
    app.set('views', path.join(__dirname, './views'));

// Take a port 3000 for running server.
const port: number = 3000;

async function getURL(url: string) {
    return new Promise((resolve) => {
        let data: any[] = [];

        https.get(url, res => {

            res.on('data', chunk => {
                data.push(chunk);
            });

            res.on('end', () => {

               resolve(JSON.parse(Buffer.concat(data).toString()));

            })
        }) 
    })
}

// Handling '/' Request
app.get('/', (_req, _res) => {
    let url = "https://api-archive.mainnet.desmos.network/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=150";
    https.get(url, res=>{
        let data: any[] = [];
        res.on('data', chunk => {
            data.push(chunk);
        });
        res.on('end', async () =>  {
            console.log('Response validators ended: ');
            const validatorsData = JSON.parse(Buffer.concat(data).toString()).validators;
            let totalUnbonding = 0;
            for (let i in validatorsData){
                // validators.push(validatorsData[i].operator_address);
                url = `https://api-archive.mainnet.desmos.network/cosmos/staking/v1beta1/validators/${validatorsData[i].operator_address}/unbonding_delegations`;

                let data:any = await getURL(url);
                if (data?.unbonding_responses.length> 0){
                    for (let j in data?.unbonding_responses){
                        let balances = 0;
                        for (let k in data?.unbonding_responses[j].entries){
                            // console.log(unbondingResponses[j].entries[k]);
                            balances += parseInt(data?.unbonding_responses[j].entries[k].balance);
                        }
                        totalUnbonding += balances;
                    }
                }
            }
            // console.log(totalUnbonding);
            url = "https://api-archive.mainnet.desmos.network/cosmos/tx/v1beta1/txs?events=message.action='/cosmos.staking.v1beta1.MsgUndelegate'&order_by=2&limit=100";
            https.get(url, res=>{
                let data:any[] = [];
                res.on('data', chunk => {
                    data.push(chunk);
                  });
                  res.on('end', () => {
                    console.log('Response ended: ');
                    const unbonding = JSON.parse(Buffer.concat(data).toString()).txs;
                    let delegators:any[] = [];
                    let total = 0;
                    for (let i in unbonding){
                        let tx = unbonding[i];
                        for (let j in tx.body.messages){
                            // console.log(tx.body.messages[j]['@type'])
                            if (tx.body.messages[j]['@type'] == '/cosmos.staking.v1beta1.MsgUndelegate'){
                                if (delegators[tx.body.messages[j].delegator_address]){
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
                    for (let i in delegators){
                        unbondings.push({address:i, amount:numeral(delegators[i]/1000000).format('0,0.000000')});
                    }
                    total = total / 1000000;
                    _res.render('index', { unbondings: unbondings, total:numeral(total).format('0,0.000000'), totalUnbonding: numeral(totalUnbonding/1000000).format('0,0.000000') });
                    console.log('Done 🎉');
                  });
                }).on('error', err => {
                  console.log('Error: ', err.message);
                });
            })
        });
    });



 
// Server setup
app.listen(port, () => {
    console.log(`TypeScript with Express 
         http://localhost:${port}/`);
});