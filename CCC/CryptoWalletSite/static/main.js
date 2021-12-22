const vm = new Vue({
    el: "#app",
    delimiters: ['[[', ']]'],
    data: {
        walletAddress: '',
        zapperAPIkey : '96e0cc51-a62e-42ca-acee-910ea7d2a241',
        listOfsupporteProtocals : [],
        stakedCoins : [],
        walletCoins : [],
        historyTransactions : [],
        networkImages : {
            'arbitrum' : 'https://zapper.fi/images/networks/arbitrum-icon.png',
            'avalanche' : 'https://zapper.fi/images/networks/avalanche-icon.png',
            'binance-smart-chain' : 'https://zapper.fi/images/networks/binance-smart-chain-icon.png',
            'celo' : 'https://zapper.fi/images/networks/celo-icon.png',
            'ethereum' : 'https://zapper.fi/images/networks/ethereum-icon.png',
            'fantom' : 'https://zapper.fi/images/networks/fantom-icon.png',
            'harmony' : 'https://zapper.fi/images/networks/harmony-icon.png',
            'optimism' : 'https://zapper.fi/images/networks/optimism-icon.png',
            'polygon' : 'https://zapper.fi/images/networks/polygon-icon.png',
        },

        allCoins: [],

        netWorth: 0,
        userWallet: '',
    },
    // created: function(){
        
    //     this.getWallet()
    // },
    methods: {
        getWallet: function() {
            
            if (ethereum.request()){
            ethereum.request({ method: 'eth_requestAccounts' }).then(response=>{ 
                this.walletAddress = response
                this.userWallet = this.walletAddress[0]
                this.checkProtocal()
            }) }
            
            else {
                alert('No MetaMask extension deteted')
            }

        },
        checkProtocal: function() {
            axios({
                method: 'get',
                url: 'https://api.zapper.fi/v1/protocols/balances/supported',
                params: {
                    addresses : this.walletAddress,
                    api_key: '96e0cc51-a62e-42ca-acee-910ea7d2a241',
                },
                }).then(response => {
                    try {

                    
                        let listOfProtocals = response.data
                        listOfProtocals.forEach( protocal => {
                        
                            let network = protocal.network
                            let each = protocal.apps

                                each.forEach(appObject => {
                                    
                                    let app = appObject.appId

                                    if ( app != 'tokens') {

                                        this.listOfsupporteProtocals.push({

                                            'network' : network,
                                            'app' : app,
                                            'balance' : 0,
                                            'img': this.networkImages[network],                   
                                        })
                                    }
                                })
                        })
                    } catch (error) {}
                    this.getWalletBalance()
                    this.getStakedBalance()
                    this.getHistoryNetwork()
                })
        },
        getWalletBalance: function() {
            
            this.listOfsupporteProtocals.forEach( protocal => {
                axios({
                    method: 'get',
                    url: 'https://api.zapper.fi/v1/protocols/tokens/balances',
                    params: {
                        addresses : this.walletAddress,
                        network : protocal.network,
                        api_key: '96e0cc51-a62e-42ca-acee-910ea7d2a241',
                        },
                        }).then(response => {
                        try {
                            let walletCoin = response.data[ this.walletAddress[0] ].products[0].assets
                            
                            
                            if (walletCoin.length > 1) {
                                walletCoin.forEach( obj => {
                                    
                                    if (!obj.symbol.startsWith('s')) {
                                        this.walletCoins.push(obj)
                                        this.netWorth += obj.balanceUSD
                                        this.listOfsupporteProtocals.forEach( prot => {
                                            if (prot.network === obj.network) {
                                                prot.balance += obj.balanceUSD
                                            }
                                        })
                                    }
                            
                                })
                            }
                            else {
                                if (!walletCoin[0].symbol.startsWith('s')) {
                                    
                                    this.walletCoins.push(walletCoin[0])
                                    this.netWorth += walletCoin[0].balanceUSD
                                }
                            }

                        } catch (error) {}
                        
                        })
            })

        },
        getStakedBalance: function() {
            
            this.listOfsupporteProtocals.forEach( protocal => {
                
                axios({
                    method: 'get',
                    url: `https://api.zapper.fi/v1/protocols/${protocal.app}/balances`,
                    params: {
                        addresses : this.walletAddress,
                        network : protocal.network,
                        api_key: '96e0cc51-a62e-42ca-acee-910ea7d2a241',
                    },
                    }).then(response => {               
                        try {
                        let vaultCoin = response.data[ this.walletAddress[0] ].products[0].assets[0]
                        this.stakedCoins.push(vaultCoin) 
                        this.netWorth += vaultCoin.balanceUSD

                        this.listOfsupporteProtocals.forEach( prot => {
                            if (prot.network === vaultCoin.network) {
                                prot.balance += vaultCoin.balanceUSD
                            }
                        })
                    }
                        catch (error) {}
                    
                    })
            })
        },
        getHistoryNetwork: function() {
            this.history1 = []
            let promises = []

            this.listOfsupporteProtocals.forEach( protocal => {
                promises.push(
                    axios({
                        method: 'get',
                        url: `https://api.zapper.fi/v1/transactions`,
                        params: {
                            address : this.walletAddress[0],
                            addresses : this.walletAddress,
                            network : protocal.network,
                            api_key: '96e0cc51-a62e-42ca-acee-910ea7d2a241',
                        },
                    }) 
                )                
            })
            Promise.allSettled(promises)
                .then(results => {
                    results.forEach( each => {
                        if ( each.value ) {
                            this.historyTransactions.push(...each.value.data.data)
                            }
                    }) 
            }) 
        },
        loadCoins: function() {
            let i = 0
            while (i < 1) {
            i++ 
                axios({
                method: 'get',
                url: 'https://api.coingecko.com/api/v3/coins/markets?',
                params: {
                    vs_currency : 'usd',
                    order : 'market_cap_desc',
                    per_page : '250',
                    page : i,
                    sparkline: 'false',
                }
            }).then(response => this.allCoins = this.allCoins.concat(response.data))
        }},

        getGraph: function() {

                Highcharts.stockChart('container', {
            
                    rangeSelector: {
                        selected: 1
                    },
            
                    title: {
                        text: 'AAPL Stock Price'
                    },
            
                    series: [{
                        name: 'AAPL Stock Price',
                        data: [[1577111400000,71],[1577197800000,71.07],[1577370600000,72.48],[1577457000000,72.45],[1577716200000,72.88],[1577802600000,73.41],[1577975400000,75.09],[1578061800000,74.36],[1578321000000,74.95],[1578407400000,74.6],[1578493800000,75.8],[1578580200000,77.41],[1578666600000,77.58],[1578925800000,79.24],[1579012200000,78.17],[1579098600000,77.83],[1579185000000,78.81],[1579271400000,79.68],[1579617000000,79.14],[1579703400000,79.43],[1579789800000,79.81],[1579876200000,79.58],[1580135400000,77.24],[1580221800000,79.42],[1580308200000,81.08],[1580394600000,80.97],[1580481000000,77.38],[1580740200000,77.17],[1580826600000,79.71],[1580913000000,80.36],[1580999400000,81.3],[1581085800000,80.01],[1581345000000,80.39],[1581431400000,79.9],[1581517800000,81.8],[1581604200000,81.22],[1581690600000,81.24],[1582036200000,79.75],[1582122600000,80.9],[1582209000000,80.07],[1582295400000,78.26],[1582554600000,74.54],[1582641000000,72.02],[1582727400000,73.16],[1582813800000,68.38],[1582900200000,68.34],[1583159400000,74.7],[1583245800000,72.33],[1583332200000,75.68],[1583418600000,73.23],[1583505000000,72.26],[1583760600000,66.54],[1583847000000,71.33],[1583933400000,68.86],[1584019800000,62.06],[1584106200000,69.49],[1584365400000,60.55],[1584451800000,63.22],[1584538200000,61.67],[1584624600000,61.19],[1584711000000,57.31],[1584970200000,56.09],[1585056600000,61.72],[1585143000000,61.38],[1585229400000,64.61],[1585315800000,61.94],[1585575000000,63.7],[1585661400000,63.57],[1585747800000,60.23],[1585834200000,61.23],[1585920600000,60.35],[1586179800000,65.62],[1586266200000,64.86],[1586352600000,66.52],[1586439000000,67],[1586784600000,68.31],[1586871000000,71.76],[1586957400000,71.11],[1587043800000,71.67],[1587130200000,70.7],[1587389400000,69.23],[1587475800000,67.09],[1587562200000,69.03],[1587648600000,68.76],[1587735000000,70.74],[1587994200000,70.79],[1588080600000,69.64],[1588167000000,71.93],[1588253400000,73.45],[1588339800000,72.27],[1588599000000,73.29],[1588685400000,74.39],[1588771800000,75.16],[1588858200000,75.93],[1588944600000,77.53],[1589203800000,78.75],[1589290200000,77.85],[1589376600000,76.91],[1589463000000,77.39],[1589549400000,76.93],[1589808600000,78.74],[1589895000000,78.29],[1589981400000,79.81],[1590067800000,79.21],[1590154200000,79.72],[1590499800000,79.18],[1590586200000,79.53],[1590672600000,79.56],[1590759000000,79.49],[1591018200000,80.46],[1591104600000,80.83],[1591191000000,81.28],[1591277400000,80.58],[1591363800000,82.88],[1591623000000,83.36],[1591709400000,86],[1591795800000,88.21],[1591882200000,83.97],[1591968600000,84.7],[1592227800000,85.75],[1592314200000,88.02],[1592400600000,87.9],[1592487000000,87.93],[1592573400000,87.43],[1592832600000,89.72],[1592919000000,91.63],[1593005400000,90.01],[1593091800000,91.21],[1593178200000,88.41],[1593437400000,90.44],[1593523800000,91.2],[1593610200000,91.03],[1593696600000,91.03],[1594042200000,93.46],[1594128600000,93.17],[1594215000000,95.34],[1594301400000,95.75],[1594387800000,95.92],[1594647000000,95.48],[1594733400000,97.06],[1594819800000,97.72],[1594906200000,96.52],[1594992600000,96.33],[1595251800000,98.36],[1595338200000,97],[1595424600000,97.27],[1595511000000,92.85],[1595597400000,92.61],[1595856600000,94.81],[1595943000000,93.25],[1596029400000,95.04],[1596115800000,96.19],[1596202200000,106.26],[1596461400000,108.94],[1596547800000,109.67],[1596634200000,110.06],[1596720600000,113.9],[1596807000000,111.11],[1597066200000,112.73],[1597152600000,109.38],[1597239000000,113.01],[1597325400000,115.01],[1597411800000,114.91],[1597671000000,114.61],[1597757400000,115.56],[1597843800000,115.71],[1597930200000,118.28],[1598016600000,124.37],[1598275800000,125.86],[1598362200000,124.82],[1598448600000,126.52],[1598535000000,125.01],[1598621400000,124.81],[1598880600000,129.04],[1598967000000,134.18],[1599053400000,131.4],[1599139800000,120.88],[1599226200000,120.96],[1599571800000,112.82],[1599658200000,117.32],[1599744600000,113.49],[1599831000000,112],[1600090200000,115.36],[1600176600000,115.54],[1600263000000,112.13],[1600349400000,110.34],[1600435800000,106.84],[1600695000000,110.08],[1600781400000,111.81],[1600867800000,107.12],[1600954200000,108.22],[1601040600000,112.28],[1601299800000,114.96],[1601386200000,114.09],[1601472600000,115.81],[1601559000000,116.79],[1601645400000,113.02],[1601904600000,116.5],[1601991000000,113.16],[1602077400000,115.08],[1602163800000,114.97],[1602250200000,116.97],[1602509400000,124.4],[1602595800000,121.1],[1602682200000,121.19],[1602768600000,120.71],[1602855000000,119.02],[1603114200000,115.98],[1603200600000,117.51],[1603287000000,116.87],[1603373400000,115.75],[1603459800000,115.04],[1603719000000,115.05],[1603805400000,116.6],[1603891800000,111.2],[1603978200000,115.32],[1604064600000,108.86],[1604327400000,108.77],[1604413800000,110.44],[1604500200000,114.95],[1604586600000,119.03],[1604673000000,118.69],[1604932200000,116.32],[1605018600000,115.97],[1605105000000,119.49],[1605191400000,119.21],[1605277800000,119.26],[1605537000000,120.3],[1605623400000,119.39],[1605709800000,118.03],[1605796200000,118.64],[1605882600000,117.34],[1606141800000,113.85],[1606228200000,115.17],[1606314600000,116.03],[1606487400000,116.59],[1606746600000,119.05],[1606833000000,122.72],[1606919400000,123.08],[1607005800000,122.94],[1607092200000,122.25],[1607351400000,123.75],[1607437800000,124.38],[1607524200000,121.78],[1607610600000,123.24],[1607697000000,122.41],[1607956200000,121.78],[1608042600000,127.88],[1608129000000,127.81],[1608215400000,128.7],[1608301800000,126.66],[1608561000000,128.23],[1608647400000,131.88],[1608733800000,130.96],[1608820200000,131.97],[1609165800000,136.69],[1609252200000,134.87],[1609338600000,133.72],[1609425000000,132.69],[1609770600000,129.41],[1609857000000,131.01],[1609943400000,126.6],[1610029800000,130.92],[1610116200000,132.05],[1610375400000,128.98],[1610461800000,128.8],[1610548200000,130.89],[1610634600000,128.91],[1610721000000,127.14],[1611066600000,127.83],[1611153000000,132.03],[1611239400000,136.87],[1611325800000,139.07],[1611585000000,142.92],[1611671400000,143.16],[1611757800000,142.06],[1611844200000,137.09],[1611930600000,131.96],[1612189800000,134.14],[1612276200000,134.99],[1612362600000,133.94],[1612449000000,137.39],[1612535400000,136.76],[1612794600000,136.91],[1612881000000,136.01],[1612967400000,135.39],[1613053800000,135.13],[1613140200000,135.37],[1613485800000,133.19],[1613572200000,130.84],[1613658600000,129.71],[1613745000000,129.87],[1614004200000,126],[1614090600000,125.86],[1614177000000,125.35],[1614263400000,120.99],[1614349800000,121.26],[1614609000000,127.79],[1614695400000,125.12],[1614781800000,122.06],[1614868200000,120.13],[1614954600000,121.42],[1615213800000,116.36],[1615300200000,121.09],[1615386600000,119.98],[1615473000000,121.96],[1615559400000,121.03],[1615815000000,123.99],[1615901400000,125.57],[1615987800000,124.76],[1616074200000,120.53],[1616160600000,119.99],[1616419800000,123.39],[1616506200000,122.54],[1616592600000,120.09],[1616679000000,120.59],[1616765400000,121.21],[1617024600000,121.39],[1617111000000,119.9],[1617197400000,122.15],[1617283800000,123],[1617629400000,125.9],[1617715800000,126.21],[1617802200000,127.9],[1617888600000,130.36],[1617975000000,133],[1618234200000,131.24],[1618320600000,134.43],[1618407000000,132.03],[1618493400000,134.5],[1618579800000,134.16],[1618839000000,134.84],[1618925400000,133.11],[1619011800000,133.5],[1619098200000,131.94],[1619184600000,134.32],[1619443800000,134.72],[1619530200000,134.39],[1619616600000,133.58],[1619703000000,133.48],[1619789400000,131.46],[1620048600000,132.54],[1620135000000,127.85],[1620221400000,128.1],[1620307800000,129.74],[1620394200000,130.21],[1620653400000,126.85],[1620739800000,125.91],[1620826200000,122.77],[1620912600000,124.97],[1620999000000,127.45],[1621258200000,126.27],[1621344600000,124.85],[1621431000000,124.69],[1621517400000,127.31],[1621603800000,125.43],[1621863000000,127.1],[1621949400000,126.9],[1622035800000,126.85],[1622122200000,125.28],[1622208600000,124.61],[1622554200000,124.28],[1622640600000,125.06],[1622727000000,123.54],[1622813400000,125.89],[1623072600000,125.9],[1623159000000,126.74],[1623245400000,127.13],[1623331800000,126.11],[1623418200000,127.35],[1623677400000,130.48],[1623763800000,129.64],[1623850200000,130.15],[1623936600000,131.79],[1624023000000,130.46],[1624282200000,132.3],[1624368600000,133.98],[1624455000000,133.7],[1624541400000,133.41],[1624627800000,133.11],[1624887000000,134.78],[1624973400000,136.33],[1625059800000,136.96],[1625146200000,137.27],[1625232600000,139.96],[1625578200000,142.02],[1625664600000,144.57],[1625751000000,143.24],[1625837400000,145.11],[1626096600000,144.5],[1626183000000,145.64],[1626269400000,149.15],[1626355800000,148.48],[1626442200000,146.39],[1626701400000,142.45],[1626787800000,146.15],[1626874200000,145.4],[1626960600000,146.8],[1627047000000,148.56],[1627306200000,148.99],[1627392600000,146.77],[1627479000000,144.98],[1627565400000,145.64],[1627651800000,145.86],[1627911000000,145.52],[1627997400000,147.36],[1628083800000,146.95],[1628170200000,147.06],[1628256600000,146.14],[1628515800000,146.09],[1628602200000,145.6],[1628688600000,145.86],[1628775000000,148.89],[1628861400000,149.1],[1629120600000,151.12],[1629207000000,150.19],[1629293400000,146.36],[1629379800000,146.7],[1629466200000,148.19],[1629725400000,149.71],[1629811800000,149.62],[1629898200000,148.36],[1629984600000,147.54],[1630071000000,148.6],[1630330200000,153.12],[1630416600000,151.83],[1630503000000,152.51],[1630589400000,153.65],[1630675800000,154.3],[1631021400000,156.69],[1631107800000,155.11],[1631194200000,154.07],[1631280600000,148.97],[1631539800000,149.55],[1631626200000,148.12],[1631712600000,149.03],[1631799000000,148.79],[1631885400000,146.06],[1632144600000,142.94],[1632231000000,143.43],[1632317400000,145.85],[1632403800000,146.83],[1632490200000,146.92],[1632749400000,145.37],[1632835800000,141.91],[1632922200000,142.83],[1633008600000,141.5],[1633095000000,142.65],[1633354200000,139.14],[1633440600000,141.11],[1633527000000,142],[1633613400000,143.29],[1633699800000,142.9],[1633959000000,142.81],[1634045400000,141.51],[1634131800000,140.91],[1634218200000,143.76],[1634304600000,144.84],[1634563800000,146.55],[1634650200000,148.76],[1634736600000,149.26],[1634823000000,149.48],[1634909400000,148.69],[1635168600000,148.64],[1635255000000,149.32],[1635341400000,148.85],[1635427800000,152.57],[1635514200000,149.8],[1635773400000,148.96],[1635859800000,150.02],[1635946200000,151.49],[1636032600000,150.96],[1636119000000,151.28],[1636381800000,150.44],[1636468200000,150.81],[1636554600000,147.92],[1636641000000,147.87],[1636727400000,149.99],[1636986600000,150],[1637073000000,151],[1637159400000,153.49],[1637245800000,157.87],[1637332200000,160.55],[1637591400000,161.02],[1637677800000,161.41],[1637764200000,161.94],[1637937000000,156.81],[1638196200000,160.24],[1638282600000,165.3],[1638369000000,164.77],[1638455400000,163.76],[1638541800000,161.84],[1638801000000,165.32],[1638887400000,171.18],[1638973800000,175.08],[1639060200000,174.56],[1639146600000,179.45],[1639405800000,175.74],[1639492200000,174.33],[1639578600000,179.3],[1639665000000,172.26],[1639751400000,171.14],[1640010600000,169.75],[1640120403000,172.99]],
                        type: 'spline',
                        tooltip: {
                            valueDecimals: 2
                        }
                    }]
                });
            


        }

































    // updateWallet: function() {
            
    //     ethereum.request({ method: 'eth_requestAccounts' }).then(response=>{
    //         this.walletAddress = response
    //     }).then( response => {
    //             let url = 'https://api.zapper.fi/v1/balances?addresses[0]=' + this.walletAddress + '&nonNilOnly=true&network[0]=Ethereum&network[1]=polygon&network[2]=optimism&network[3]=xdai&network[4]=binance-smart-chain&network[5]=fantom&network[6]=avalanche&network[7]=arbitrum&network[8]=celo&network[9]=harmony&api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241'
    //             let es = new EventSource(url);
    //             es.addEventListener('balance', event => {
    //             let data = JSON.parse(event.data);
    //             console.log(data)
    //             this.coinsList = data
    //             }, false);
    //     })
    // },

    }, //end of methods

}) // end of vue app
