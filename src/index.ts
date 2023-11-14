
// Import the express in typescript file
import express from 'express';
import https from 'https';
import numeral from 'numeral';

// Initialize the express engine
const app: express.Application = express();
app.set('view engine', 'pug');
app.set('views', '../views');
 
// Take a port 3000 for running server.
const port: number = 3000;

// Handling '/' Request
app.get('/', (_req, _res) => {
    // _res.send("TypeScript With Express");
    const url = "https://api.mainnet.desmos.network/cosmos/tx/v1beta1/txs?events=message.action='/cosmos.staking.v1beta1.MsgUndelegate'&order_by=2&limit=100";
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
            _res.render('index', { unbondings: unbondings, total:numeral(total).format('0,0.000000') })
          });
        }).on('error', err => {
          console.log('Error: ', err.message);
        });
    })

 
// Server setup
app.listen(port, () => {
    console.log(`TypeScript with Express 
         http://localhost:${port}/`);
});