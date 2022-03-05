
This script will periodically reload the page of a Phabricator Revision while its tests are running. It will stop when either the tests pass or fail.

The page will not reload if you are viewing the diff's contents, only if you are near the top of the page or watching the tests area.

When the Revision loads, the favicon will be updated to either ✅ or ❌ if the tests have passed or failed, respectively. If the tests are still running, the icon will be ⏳. Closed Revisions will have the icon 🚢.

In addition, if the page is refocused and more than 2 minutes have passed since it was loaded, it will reload. This will occur regardless of whether the tests are running or not, unless the Revision is closed.

These changes should make it easier to wait for tests to run without having to reload the page manually when changes are pushed.
