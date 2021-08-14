# google-bookmark-migrator

Now google bookmarks is shutting down I need to migrate to a new provider.  I picked https://tagpacker.com, but there are others available.

I had an issue importing my bookmarks into TagPacker and figured it was to do with the size of my bookmark file I was using (it's over 3mb! and 15+ years of bookmarks!).  To underline I think this is to do with things be blocked on my side for some reason, not with TagPacker's upload facility.

So I've knocked this up to split the file into multiple batches that can be uploaded separately.  It's really hacky and horrible code but it's a one off thing so I've not that invested in it.

Anyway, you may find it useful too.  There's nothing specific for TagPacker, so may be useful for other providers.

1.  Download this repo somewhere
2.  Export your bookmarks from Google Bookmarks
3.  Copy the contents of your export to the clipboard
4.  Paste the contents into the top of the "google-bookmark-migrator.html" file
5.  Open the "google-bookmark-migrator.html" in Chrome (haven't tested anything else, I was using Brave).
6.  Follow the prompts in the "google-bookmark-migrator.html" webpage.

Ultimately you'll end up downloading multiple HTML files you can use to import.  Each file is approx 500mb which seems to work (you can change the constant to something else if you need, search for "MAX_BYTES" in the "export-to-csv.js" file).

