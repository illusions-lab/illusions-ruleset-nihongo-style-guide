# Changelog

すべての重要な変更をこのファイルに記録します。
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠し、
[Semantic Versioning](https://semver.org/lang/ja/) を採用します。

## [Unreleased]

## [0.4.1] - 2026-06-21

### Changed

- マーケットプレイス用 OG 画像（`OG.png`）を作成。
- `LICENSE` の著作権者を記入し、テンプレート残置（CHANGELOG 初版・docs サンプル参照・README 脚注・重複 .github）を整理。

## [0.4.0] - 2026-06-20

### Changed

- `nsg-repetition-mark`（繰り返し符号々の誤用）の `applicableModes` を `["official","blog","academic"]` から `["novel","official","blog","academic","sns"]` に拡張。複合語をまたぐ々の誤用（例: 研究会々長→研究会会長）は作家的判断ではなく客観的な正書法の誤り（correctness）であるため、kousei-hikkei の同種ルール `kh-kurikaeshi-kanji-2`（全5モード）との横断整合を取り `novel` および `sns` を追加した。

## [0.1.0] - 2026-06-19

### Added

- 初版。カタカナ長音・約物・単位表記・全角英数・波ダッシュ・繰り返し符号・補助動詞/形式名詞など全 12 ルール（日本語スタイルガイド 第3版 準拠）を実装。
