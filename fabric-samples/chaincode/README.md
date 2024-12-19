# 部署区块链网络

## 启动Test Network并创建通道

```bash
cd fabric-samples/test-network
./network.sh up createChannel -c filechannel
```

## 部署智能合约

```bash
./network.sh deployCC -ccn filesigncc -ccp ../chaincode/filesigncc -ccl javascript -c filechannel
```

## 初始化

```bash
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C filechannel -n filesigncc --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'
```

## 验证是否正常

```bash
peer chaincode query -C filechannel -n filesigncc -c '{"function":"getFileRecord","Args":["hash123"]}'
```

# 后端连接

### 后端复制网络配置

```bash
cp ../../test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json ./networkConfig.json
```

## 添加用户

```bash
node addAdmin.js
```

