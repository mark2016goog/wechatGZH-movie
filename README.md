# NodeJS搭建微信公众号
将微信公众号与电影网站连通，样式略渣，但所有功能已经实现。

## 1. 用到的知识技能

### 1.1 公众号开发需要与公众号后台有交互，需要在后台网页进行配置，比如通信的域名，地地址，`js sdk`的授权地址等等。

### 1.2 部分es6语法，比如`yield`

### 1.3 NodeJS `koa`框架(`koa-router`)， 主要用于处理服务器之间的应用初始化、接口调用以及数据间的相应。
更多关于`koa`可见于[koa官网](http://koajs.com/)或者[koa中文网](http://koa.bootcss.com/)

### 1.4 Promise库，`bluebird`，用来处理和封装异步请求，（注：在ES6中 ，Promise其实已经原生提供）

#### 1.5 网络请求使用request，它是对原生的  `http  request`的封装

###1.6 微信的数据包装方式是XML，所以可以借助`  ejs`这个模板库，把数据作为变量替换到XML字符中。

### 1.7 工具模块
>1. `lodash`:一些常用的方法集，做数组拆分、类型判断等。
>2. `Heredoc`: 把函数体里面的多行注释作为字符串提取出来，主要用来降低拼接字符串的成本。
>3. `raw-body`:用来获取一个`http`请求返回的可读流的内容实体。
>4. `sha1`：哈希算法库，用于加密。
>5. `xml2js`:微信服务器返回的数据是xml格式，借助此模块将xml数据解析为js对象，方便使用。 

## 2. 域名、服务器以及ngrok的环境配置
	必须拥有自己的域名，可以直接在服务器上开发，使用反向代理服务器工具
    frp 是一个高性能的反向代理应用，可以帮助您轻松地进行内网穿透，对外网提供服务，支持 tcp, http, https 等协议类型，并且 web 服务支持根据域名进行路由转发。
    具体可见[github](https://github.com/fatedier/frp/blob/master/README_zh.md)

>安装localtunnel模块，这是frp基于node的模块
>npm install -g localtunnel

除此之外，也有其他一些将内网服务暴露于外网的工具，例如**花生壳、PageKite**等。


Generator函数执行流程：
app.js-->g.js(config.wechat,weixin.reply)-->
