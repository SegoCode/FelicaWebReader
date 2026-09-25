<a href="README.ja.md"><img align="right" alt="日本語" src="https://img.shields.io/badge/%E6%97%A5%E6%9C%AC%E8%AA%9E-24292f?style=for-the-badge"></a>
<a href="README.md"><img align="right" alt="English" src="https://img.shields.io/badge/English-0969da?style=for-the-badge"></a>

# FelicaWebReader

<p align="center">
  <img src="media/demo2.jpg" height="360">
  <img src="media/pasori.webp" height="360">
</p>

<p align="center">
  <a href="#概要">概要</a> •
  <a href="#機能">機能</a> •
  <a href="#クイックスタート">クイックスタート</a>
</p>

## 概要
[![Top language](https://img.shields.io/github/languages/top/SegoCode/FelicaWebReader?style=flat-square)](https://github.com/SegoCode/FelicaWebReader)
[![Repository size](https://img.shields.io/github/repo-size/SegoCode/FelicaWebReader?style=flat-square&label=repo%20size)](https://github.com/SegoCode/FelicaWebReader)
[![Commit activity per year](https://img.shields.io/github/commit-activity/y/SegoCode/FelicaWebReader?style=flat-square&label=commits)](https://github.com/SegoCode/FelicaWebReader/graphs/commit-activity)
[![License: PolyForm Noncommercial + GNU AGPL-3.0](https://img.shields.io/badge/License-PolyForm%20Noncommercial%20%2B%20GNU%20AGPL--3.0-blue?style=flat-square)](https://github.com/SegoCode/FelicaWebReader/blob/main/LICENSE)
[![Bitcoin BTC](https://img.shields.io/badge/buy_me_a_coffee-BTC-F7931A?style=flat-square&logo=bitcoin&logoColor=white)](https://github.com/SegoCode/SegoCode/discussions/2)


Sony PaSoRi 向けのサーバーレス WebUSB 実装。Suica、PASMO、ICOCA などの交通系ICカード（FeliCa）を、ブラウザから直接読み取る。

## 機能

- クライアント側だけの WebUSB。ページを開いてリーダーを接続する。サーバーは不要。
- カード番号と残高（円）を表示する。
- 最近の乗車と、それ以外の購入を一覧する。

## クイックスタート

1. Sony PaSoRi リーダーをコンピューターに接続する。
2. Google Chrome または Microsoft Edge で https://segocode.github.io/FelicaWebReader/ を開く（WebUSB が必要）。
3. **Connect reader** をクリックし、ブラウザの確認でアクセスを許可する。
4. ICカードをリーダーに置く。

> [!WARNING]
> 別のアプリがすでにリーダーを使っている場合は、そのアプリを終了してから **Connect reader** を再度クリックする。

---
<p align="center"><a href="https://github.com/SegoCode/FelicaWebReader/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SegoCode/FelicaWebReader" />
</a></p>
