# Changelog

All notable changes to Bulutlar are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.1] - 2026-06-13

### Added
- Import `.blt` archive bundles into the library from file open and settings
- New Color themes

### Changed
- Improved `.blt` export/import flow and handling
- Improved handling of media files
- Improved pdf-word export

### Removed
- Remove draft-js and related stuff

## [2.1.2] - 2026-06-02

### Added
- Export ZIP button in settings for sharing bundles

## [2.1.1] - 2026-05-25

### Added
- Admin mode (unlock via hidden gesture in update settings)
- App footer

### Changed
- Sharing UI improvements for article dates
- Style refinements across settings and sharing screens

## [2.1.0] - 2026-05-06

### Added
- Sharing service and `.blt` bundle export for mobile sync
- Shape B `.blt` format and prefixed manifest header for faster mobile imports
- Output directory selection for bundle exports
- Maintenance tools for orphan media cleanup
- macOS `.blt` file association (UTI / plist)

### Changed
- Article revision tracking and async sync hooks
- Improved media handling in bundle builder and sharing pipeline
- Removed unused Tiptap extensions

### Fixed
- Article date normalization on create and startup migrations

## [2.0.3] - 2026-04-21

### Changed
- Improved HTML to Tiptap JSON media conversion
- Database article and comment processing for Tiptap JSON fields

## [2.0.2] - 2026-04-18

### Added
- Sample data loading (development only)

### Changed
- Enhanced HTML processing and Word document generation

## [2.0.1] - 2026-04-17

### Changed
- Preserved legacy Draft.js JSON columns on Tiptap saves
- Improved draft-to-Tiptap conversion (empty paragraph collapsing, nested lists)

## [2.0.0] - 2026-04-07

### Added
- Tiptap rich-text editor (replacing Draft.js)
- Article quote marks and context-menu quote management
- Search highlight navigation in Tiptap editor
- Article link extension and restricted-editing plugin
- Migration path from Draft.js content to Tiptap format

### Changed
- Upgraded Tiptap dependencies to v3.x
- Database models and services updated for Tiptap integration

## [1.4.39] - 2026-04-06

### Changed
- Sticky date positioning in search results via resize observer

## [1.4.38] - 2026-04-02

### Added
- macOS entitlements for hardened runtime and notarization

## [1.4.37] - 2026-03-28

### Fixed
- UrlFetchService now clears session storage and cache after use

## [1.4.35] - 2026-03-13

### Changed
- Replaced react-split-pane with react-resizable-panels in search and read screens

## [1.4.34] - 2026-03-03

### Changed
- Normalized filenames in export dialogs for safer file names

## [1.4.33] - 2026-02-16

### Changed
- URL fetching and PDF generation now use Electron Chromium instead of Puppeteer

## [1.4.32] - 2026-02-14

### Added
- Sticky date header in search results

### Changed
- Optimized date filtering in search results

## [1.4.30] - 2026-02-10

### Added
- Share articles and database merge import from export modal

## [1.4.29] - 2026-02-10

### Changed
- Dependency updates and cleanup

## [1.4.27] - 2025-12-13

### Added
- In-app update checking from settings

## [1.4.26] - 2025-12-12

### Fixed
- Inline toolbar z-index in editor

## [1.4.25] - 2025-12-10

### Fixed
- Media player stop issue when toggling fullscreen

## [1.4.24] - 2025-12-07

### Added
- Date labels in article list
- Read/unread icon filters for articles

### Fixed
- Fullscreen mode improvements and inline toolbar positioning
- Date label positioning
- Electron cache disabled; unsaved-work confirmation on article delete

## [1.4.12] - 2025-10-15

### Changed
- Layout improvements

### Fixed
- Bug fixes

## [1.4.11] - 2025-09-28

### Fixed
- Security fixes

## [1.4.10] - 2025-09-22

### Changed
- Styling improvements

### Fixed
- Bug fixes

## [1.4.9] - 2025-09-22

### Added
- Drag-and-drop ordering for tabs and cards

### Changed
- Styling improvements

### Fixed
- Bug fixes

## [1.4.8] - 2025-09-19

### Added
- Export articles as Word and PDF

### Changed
- Styling improvements

## [1.4.7] - 2025-09-17

### Added
- Read-time estimations for articles

### Fixed
- Layout and styling issues

## [1.4.6] - 2025-09-16

### Fixed
- Layout issues

## [1.4.5] - 2025-09-16

### Fixed
- Styling issues

## [1.4.4] - 2025-09-15

### Added
- Quick search
- Collapsible tag and group panels

### Fixed
- Styling fixes

## [1.4.3] - 2025-09-12

### Changed
- Performance and efficiency improvements

## [1.4.2] - 2025-09-12

### Added
- Dark mode

### Changed
- Styling updates

## [1.4.1] - 2025-09-06

### Changed
- More efficient media streaming

## [1.4.0] - 2025-08-06

### Added
- In-article search with navigate-to-search
- Ctrl/Cmd+F shortcut for the search bar
- Audio and video insertion in articles
- In-article audio/video players
