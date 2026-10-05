# Commit unstaged changes

1. Stage all unstaged changes to the current branch.

2. Make sure the current branch is not `master`, and if it is ask me first to choose on of:

- I'm sure I want to commit directly to `master`
- Switch to and commit to `develop` instead
- Checkout a new branch named based on what the unstaged changes are, and commit there instead.

3. List out all the staged and all the (still) unstaged changes and let me choose if I want to proceed, cancel, or comment on what still needs to be staged or unstaged.
   If I choose to comment, apply staging changes according to my comments and repeat this step

4. Compose a suggested commit message based off of staged changes and ask me if I'd like to accept it, replace it with my own, or comment on it.
   If I choose to comment on it, compose an updated commit message based off of my comments and repeat this step.

5. Commit staged changes with the previously composed commit message.

6. When you've committed, if the repository has a git remote origin set, ask me if you should push changes to remote.
