### Web extension to subscribe submissions on Reddit
My personal CS50 final project.

----

Now I'll take this as a base and work on a second version with different aproach.

This is a basic yet functional extension. It can be adjust with range priorities since an old submission may not be getting new comments as frequent as a new one would be. So older submissions get 'scanned' less frequently.

- It was made aiming for use on small submisissions, it can be buggy in threads with +450 comments.
-  If a comment is deleted before the notification show up, it simply would not be showing to avoid useless notification about comments that only contains "[deleted]" or "[removed]" text.

### Use it
The `build` folder contains the unpacked version of the extension ready to use. You can pack it to get this permanent on the browser or run it as temporary unpacked one.

---

If you want to make changes and build it, it does uses the following npm modules:
zangodb, jquery and timeago.js

```
npm install zangodb jquery timeago.js
```