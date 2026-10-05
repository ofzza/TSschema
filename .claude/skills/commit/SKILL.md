# Commit unstaged changes

Commit all unstaged changes to the current branch. Make sure the current branch is not `master` first, and if it is ask me first to choose on of:

- I'm sure I want to commit directly to `master`
- Switch to and commit to `develop` instead
- Checkout a new branch named based on what the unstaged changes are, and commit there instead.

When you've committed, if the repository has a git remote origin set, ask me if you should push changes to remote.
