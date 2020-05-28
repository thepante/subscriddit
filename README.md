
### Thread Subscribe for Reddit
Web extension to subscribe submissions on Reddit.

Then this was my final project for Harvard CS50. Now, with that already concluded, anybody can contribute.

![screenshot](https://i.imgur.com/TUUonPt.png)  

---

Right now I'm trying to get it cleaner.

This is a simple extension, though you can adjust 3 different levels for poll rate priorities based on its submission time. Since an old submission may not be getting new comments as frequent as a new one would be, older submissions get 'scanned' less frequently.

- It was made aiming for use on small submisissions, it can be buggy in threads with +450 comments.
- If a comment is deleted before the notification show up, it simply would not be showing to avoid useless notification about comments that only contains "[deleted]" or "[removed]" text.

### Get this
The `build` folder contains the unpacked version of the extension ready to use. 

You can pack it to get this permanent on the browser or run it as a temporary unpacked one.

---

If you want to make changes and build it, it does uses the following npm modules:
zangodb, jquery and timeago.js

```
npm install zangodb jquery timeago.js
```
----

#### To-do list
 - Panel to manage subscriptions
 - Autoremove old subscriptions
 - Better settings UI
 - Improve 'settings' code

---

Icons thanks to icons8.com
