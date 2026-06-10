# Bulutlar: A CrossPlatform Notebook Application for Desktops

Bulutlar enables users to write, read and edit articles. It offers 
- complex search and filtering,
- rich text editing,
- image/audio/video insertion,
- adding persons, categories, comments, notes and tags,
- relating articles to a person and to other articles,
- multi-language support,
- multiple articles to simultaneously be opened on tabs,
- and more.

Tech Stack:
- React
- Tiptap
- Tailwind
- Node.js
- Electron.js
- Sequelize
- SqLite

## How to run
to install the node modules
``` bash
npm install --force
```
to run react and electron concurrently
``` bash
npm run dev
```

## Installers
for Windows installer:
``` bash
npm run dist
```
for MacOs DMG:
``` bash
npm run package-mac-builder-arm64
```

## Portables
to get executable for Windows:
``` bash
npm run package-win
```

``` bash
npm run package-win32
```
to get executable for MacOs
``` bash
npm run package-mac
```
to get executable for Linux
``` bash
npm run package-linux
```

## Release notes

See [CHANGELOG.md](CHANGELOG.md) for version history. Published releases are also listed on [GitHub Releases](https://github.com/trxrg/bulutlar/releases).
