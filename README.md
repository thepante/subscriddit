
### Thread Subscribe for Reddit
Web extension to subscribe submissions on Reddit.

Then this was my final project for Harvard CS50. Now, with that already concluded, anybody can contribute.

![screenshot](https://i.imgur.com/TUUonPt.png)

---

Right now I'm trying to get it cleaner.

This is a simple extension, though you can adjust 3 different levels for poll rate priorities based on its submission time. Since an old submission may not be getting new comments as frequent as a new one would be, older submissions get 'scanned' less frequently.

- It was made aiming for use on small submisissions, it can be buggy in threads with +450 comments.
- If a comment is deleted before the notification show up, it simply would not be showing to avoid useless notification about comments that only contains "[deleted]" or "[removed]" text.
- Automatically remove subscriptions that are old. By default setted at 72 hours.
- Support to send notifications through IFTTT (see below to instructions).

### Get this
- Through [**releases section**](https://github.com/thepante/rts/releases) you can find a packed version for Firefox and Chromium (based).
- Or you can load the extension through the `build` folder that contains the unpacked version. 

---

### Use with IFTTT
You can get notifications outside your computer, sending it through IFTTT. 

For example to get the new comments in Telegram.

#### First set an applet
 1. In IFTTT create a new applet
 2. For `This` search `webhooks`, tap in it and select `Receive a web request`
 3. For `Event Name` write `new_comment`
 4. For `That` search `Telegram`, tap in it and select `Send message`
 5. For `Target chat` select `Private chat with @IFTTT`
 6. In `Message text` only let `Value1` ingredient (you can delete all, then in "Insert ingredients" select Value1)
 7. Tap `Continue` and then `Finish`

 #### Then set up the extension
 8. Now in the `Webhooks` service info: https://ifttt.com/maker_webhooks click `Documentation`
 9. Copy your key
 10. Paste that key in the addon preferences, in the field for `IFTTT Webhooks Key` and save

 With that done, the next notification would be also send to you via Telegram.

---

If you want to make changes and build it, it does uses the following npm modules:
zangodb, jquery and timeago.js

```
npm install zangodb jquery timeago.js
```
----

#### To-do list
 - Panel to manage subscriptions
 - Better settings UI
 - More options about auto-remove subscriptions

---

Icons thanks to icons8.com
