# OJ-Assistant

![VSM Version](https://badgen.net/vs-marketplace/v/SparkleL.oj-assistant)
![VSM Downloads](https://vsmarketplacebadge.apphb.com/downloads-short/SparkleL.oj-assistant.svg)
![Deploy Workflow](https://img.shields.io/github/workflow/status/lss233/oj-assistant/Deploy%20Extension)
![Dependabot](https://badgen.net/dependabot/lss233/oj-assistant?icon=dependabot)

谁不想要一个舒适的编程环境呢？

## 特性

### 查看题目

在配置文件中设置好正确的路径解析格式，当你打开一道题目时， VSCode 的左下方会显示题目的描述、样例和备注。    
* 点击样例右方的 <kbd>Copy</kbd> 按钮，可以将样例输入复制到剪贴板。
* 点击样例右方的 <kbd>Edit</kbd> 按钮，可以直接打开测试输入文件。  

![Show problem](https://image.mc9y.com/2021/01/24/c507ac4215896.gif)

### 测试输入

提供 `ojassist.dataFile` 命令，搭配 VSCode 的调试功能可以自动输入数据。  

![Test data](https://image.mc9y.com/2021/01/24/5713b08795201.gif)  

### 快速交题

1. 按下 <kbd>F1</kbd> 或 <kbd>Ctrl</kbd> + <kbd>Shift</kbd>+<kbd>P</kbd>, 输入 `submit` 查找 `OJ-Assist: Submit this code` 命令， 回车即可自动将代码提交到 OJ。
2. 右下方将会提示代码的提交进度，以及评测结果。  

![Submit code](https://image.mc9y.com/2021/01/24/f2e1d56d5f36b.gif)

## 安装及使用

当前版本的 OJ-Assistant 需要一些配置才能正常使用，  
请移步至[这里](https://github.com/lss233/oj-assistant/wiki/getting-started)。

## TODOs
- [ ] 代码通过时播放提示音
- [ ] 比赛计时
- [ ] 支持更多 OJ

## Issues & Contribution

This project is under heavy development, every help will be appreciated.

## License
This project is licensed under [MIT License](LICENSE).