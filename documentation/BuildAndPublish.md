# Device code
This is quite awkward, as can easily be improved.

`cd flipper-plugin-realm-device`
`npm run build`

then we drag the newly built index.js file into dist and overwrite the current version. Then we update version number and

`npm publish`

# Desktop code
`cd flipper-plugin-realm`

update version and then you can deploy with:

`npm publish`