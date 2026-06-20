# Changelog

すべての重要な変更をこのファイルに記録します。
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠し、
[Semantic Versioning](https://semver.org/lang/ja/) を採用します。

## [Unreleased]

## [0.4.0] - 2026-06-20

### Changed

- `nsg-repetition-mark`（繰り返し符号々の誤用）の `applicableModes` を `["official","blog","academic"]` から `["novel","official","blog","academic","sns"]` に拡張。複合語をまたぐ々の誤用（例: 研究会々長→研究会会長）は作家的判断ではなく客観的な正書法の誤り（correctness）であるため、kousei-hikkei の同種ルール `kh-kurikaeshi-kanji-2`（全5モード）との横断整合を取り `novel` および `sns` を追加した。

## [0.1.0] - 〔YYYY-MM-DD〕

### Added

- 初版。`sample-fw-exclaim` ルールを追加。
