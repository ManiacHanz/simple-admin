## dayoff-server

### 准备工具

- mongo 客户端
- restful api 测试工具 postman/talend api tester

### dev 开发

node -v > 12

```
# 测试服务器
// export APOLLO_URL=http://172.16.4.7:8080  可选
SPHINX_URL=https://https://sphinx.xrxr.xyz SSO_URL=http://api.doctorwork.com/oa-sso-web GATEWAY_URL=https://api.doctorwork.com npm start
SSO_URL=http://api-pre.doctorwork.com/oa-sso-web GATEWAY_URL=https://api-pre.doctorwork.com npm start
SSO_URL=http://api-dev.doctorwork.com/oa-sso-web GATEWAY_URL=http://api-dev.doctorwork.com npm start

export SSO_URL=http://api-dev.doctorwork.com/oa-sso-web 
// 本地安装有mongo数据库的话，可以不需要export MONGO_URL，会默认使用本地mongo
export MONGO_URL=dayoff:dayoff@172.16.4.7/dayoff 
//本地开发启动命令
npx egg-bin dev --port=7002

npm start
```

### 环境变量

通过 config/env 文件指定
```
config/env

prod
```

### 分页和关联查询