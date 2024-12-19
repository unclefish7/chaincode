# chaincode

## 目前实现的功能

- 对文件进行数字签名（用sha-256把文件进行一个hash，然后用公钥加密），把hash和签名放到链上。
- 用私钥对文件进行验证。

### 后续计划？

- 现在公私钥都是在后端写死的，后续可以改成自己添加。
- 文件验证的前端逻辑不是很合理，还需要改一改。
- 基本没有UI可言。

## 请先确保你的电脑已经安装了：Git，Docker，Docker Compose，如果电脑是Windows，请装一个WSL，然后在里面装上述内容。

在项目根目录下，运行：

```bash
./install-fabric.sh docker binary
```

然后请跳转到`./fabric-samples/chaincode`目录下

