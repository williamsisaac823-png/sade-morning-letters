# A letter for you

A sealed airmail envelope. Tap it to open, and today's note slides out.

## Add a note

Edit [`notes.js`](notes.js). On GitHub, open the file, tap the pencil, add a line and commit. The live page updates in about a minute.

```js
{ date: '2026-11-15', text: 'Your note for that day.' },
```

- The page shows the newest note dated **today or earlier**, using the phone's own date.
- You can write notes ahead of time. They show up on their day.
- A blank line inside `text` starts a new paragraph.

## Run it locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000. Double-clicking the file won't work, because browsers block modules over `file://`.

## Tests

```bash
node --test
```
