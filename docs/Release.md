# How to release

This is documenting the release process.

## Git flow

Start the release with git flow:

```sh
git flow release start MAJOR.MINOR.PATCH
```

Update the `version` from <package.json>.
Then commit and finish release.

```sh
git commit -a -m ":bookmark: MAJOR.MINOR.PATCH"
git flow release finish
```

Push everything, make sure tags are also pushed:

```sh
git push
git push origin main:main
git push --tags
```

## Publish to npm

Publication to npm happens automatically from GitHub actions on push to main.
Alternatively it can be done manually via:

```sh
yarn build
npm publish
```
