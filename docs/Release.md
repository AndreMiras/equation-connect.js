# How to release

This is documenting the release process.


## Git flow & CHANGELOG.md

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
```sh
npm publish
```
