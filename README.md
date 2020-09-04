### Work in progress. Use `master` branch instead

---

### Subscriddit: a thread subscriber for Reddit
Web extension that adds the option to subscribe to submissions on Reddit.

Back then this was my final project for Harvard CS50. With that already concluded, now anybody can contribute.

![screenshot](https://i.imgur.com/TUUonPt.png)

---

**Right now I'm working on a new version with a different aproach.**

This is a simple extension, though you can adjust 3 different levels for poll rate priorities based on its submission time; Old submissions may not be getting new comments as frequent as newer ones, so those got 'scanned' less frequently.

- Made aiming for use on small submisissions. Can be buggy on threads with +450 comments.
- If a comment is deleted before the notification shows up, it simply would not be showing to avoid useless notification about comments that only contains "[deleted]" or "[removed]" text.
- Automatically remove subscriptions that are *old*: by default setted at 72 hours.
- Support to send notifications through IFTTT (see below to instructions for using it with Telegram).

### Get this
- Through [**releases section**](https://github.com/thepante/rts/releases) you can find a packed version for Firefox and Chromium browsers.
- Or you can load the extension through the `build` folder that contains the unpacked version.
- On Chrome: you have to use the unpacked one.

---

### Get notifications on Telegram using IFTTT
You can get notifications outside your computer sending it through IFTTT. Here are the steps to get the new comments in your Telegram through @IFTTT bot chat.

**First set an applet:**

> 1. In IFTTT create a new applet
> 2. For `This` search `webhooks`, tap in it and select `Receive a web request`
> 3. For `Event Name` write `new_comment`
> 4. For `That` search `Telegram`, tap in it and select `Send message`
> 5. For `Target chat` select `Private chat with @IFTTT`
> 6. In `Message text` only leave `Value1` ingredient (you can delete all, then in "Insert ingredients" select Value1)
> 7. Tap `Continue` and then `Finish`


 **Then set up the extension:**
 > 8. Now in the `Webhooks` service info: https://ifttt.com/maker_webhooks click `Documentation`
 > 9. Copy your key
 > 10. Paste that key in the addon preferences, in the field for `IFTTT Webhooks Key` and save

 With that done, next notifications would be also send to you via Telegram.

 To stop receiving notifications through IFTTT: just empty the Webhooks Key box at the addon preferences.

---

**Dependencies:** zangodb, jquery, timeago.js

```bash
npm install  # To install the required dependencies
npm build    # To build the extension ready to use (as unpacked) or then pack it
```

----

#### Note:
I'm working on different approach. The addon its being rewritten. The then to do list now are being treated on that new version. This addon published as is (version `0.1`) will have no updates.

---

Icons thanks to icons8.com
