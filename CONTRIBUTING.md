# Contributing to sqtracker

Contributions to sqtracker are welcome. Trackers are often forked and modified, and ideally any changes and new features make their way upstream so that other users can benefit from them.

## Code style

Please follow existing conventions in code style. If you PR any messy, redundant or hard to understand code then expect changes to be requested on your PR.

### Linting

All contributions **must** be linted with the existing `yarn lint` command. Better yet, use an editor or IDE that runs the linting for you, such as WebStorm. This will keep code style mostly consistent.

### Comments

If you think a section of code is hard to understand without supporting comments, then please add them to explain what the code is doing. Don't however add redundant comments all over the place if the code can be understood just be reading it.

### CSS

When working on the front-end, always make use of the existing theme. Do not style with arbitrary `px` values etc. unless absolutely necessary. Please read up on [styled-system](https://styled-system.com/) before making front-end changes.
