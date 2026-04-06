# Tiptap Links — Manual Test Plan

## Link Click Behavior

| ID | Test | Steps | Expected | Priority |
|---|---|---|---|---|
| CLICK-01 | Left-click opens article | 1. Open article with a link. 2. Left-click the link. | Linked article opens in a new tab and becomes active. | P0 |
| CLICK-02 | Ctrl+click opens in background | 1. Open article with a link. 2. Ctrl+click (Cmd+click on Mac) the link. | Linked article opens in a new tab but current tab stays active. | P1 |
| CLICK-03 | Middle-click opens in background | 1. Open article with a link. 2. Middle-click the link. | Same as CLICK-02. No auto-scroll circle appears. | P1 |
| CLICK-04 | Click on non-link text | 1. Open article. 2. Left-click normal (non-link) text. | Nothing special happens, cursor is placed normally. | P1 |
| CLICK-05 | Click link to nonexistent article | 1. Have a link whose target article was deleted. 2. Left-click it. | Warning toast "link not found" appears. | P2 |

## Link Hover Behavior

| ID | Test | Steps | Expected | Priority |
|---|---|---|---|---|
| HOVER-01 | Hover shows article preview | 1. Hover mouse over a link. | A popup appears below the link showing article title and info. | P0 |
| HOVER-02 | Moving away hides preview | 1. Hover over a link (popup appears). 2. Move mouse away from the link. | Popup disappears. | P0 |
| HOVER-03 | Hover on non-link text | 1. Move mouse over normal text. | No popup appears. | P1 |

## Link Context Menu (Right-Click)

| ID | Test | Steps | Expected | Priority |
|---|---|---|---|---|
| CTX-01 | Right-click link shows context menu | 1. Right-click on a link. | Custom context menu appears with "Remove Link" button. Browser default menu does NOT appear. | P0 |
| CTX-02 | Right-click non-link shows browser menu | 1. Right-click on normal text. | Browser default context menu appears (no custom menu). | P1 |
| CTX-03 | Remove link button works | 1. Right-click a link. 2. Click "Remove Link". | Link is removed — text remains but is no longer styled as a link, no longer clickable. Article is persisted. | P0 |
| CTX-04 | Context menu in read-only mode | 1. View article (not in edit mode). 2. Right-click a link. | Context menu still appears with "Remove Link". | P1 |

## Link Addition

| ID | Test | Steps | Expected | Priority |
|---|---|---|---|---|
| ADD-01 | Add link to selected text | 1. Enter edit mode. 2. Select some text. 3. Use the "add link" action, pick a target article. | Selected text becomes a styled link (gold color, clickable). | P0 |
| ADD-02 | Added link persists after save | 1. Perform ADD-01. 2. Save the article. 3. Close and reopen the article. | Link is still present and functional. | P0 |
| ADD-03 | Multiple links in one article | 1. Enter edit mode. 2. Add links to two different text selections pointing to different articles. 3. Save. | Both links display correctly, each opens its respective target article. | P1 |

## Link Styling

| ID | Test | Steps | Expected | Priority |
|---|---|---|---|---|
| STYLE-01 | Link color is gold (#978800) | 1. View article with links. | Links appear in gold color, not blue. No underline. | P0 |
| STYLE-02 | Link hover changes color | 1. Hover over a link. | Color changes to lighter gold (#a89704). | P1 |
