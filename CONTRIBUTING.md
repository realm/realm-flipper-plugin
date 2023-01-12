# Contributing

## Filing Issues

Whether you find a bug, typo or an API call that could be clarified, please [file an issue](https://github.com/realm/realm-flipper-plugin/issues) on our GitHub repository.

When filing an issue, please provide as much of the following information as possible in order to help others fix it:

1. **Goals**
2. **Expected results**
3. **Actual results**
4. **Steps to reproduce**
5. **Code sample that highlights the issue** (full Xcode / Android Studio projects that we can compile ourselves are ideal)
6. **Version of Realm / Flipper Desktop Plugin / Flipper Device Plugin / Your OS**

If you'd like to send us sensitive sample code to help troubleshoot your issue, you can email <help@realm.io> directly.

## Contributing Bug Fixes and Enhancements

We love contributions to Realm! If you'd like to fix bugs, contribute code, documentation, or add any other improvements, we recommend that create a new issue to pitch what you would like to work on. Once you are ready to contribute, please [file a Pull Request](https://github.com/realm/realm-flipper-plugin/pulls) on our GitHub repository. Make sure to accept our [CLA](#cla).

If you're on the MongoDB payroll, please ensure you're familiar with [the Realm SDK cross-team working agreement](https://docs.google.com/document/d/1AB9Z1F29oLmubnPAjfphYwGz1xqqeotHaMWK5OKkL3A/edit).

When creating a PR as an external contributor, please express your intent with your PR; what do you want to solve? To avoid duplication, please link your PR to an existing issue.

Moreover, indicate how you would like us to support you. We will happily guide you and work with you to move the PR to a point where it can be merged. It might require considerable work at your end to meet our expectations (code quality, API docs, TS defs, tests, etc.). In the case you want to move on and not work with us, please let us know. If the PR meets our expectations, we will merge it - and if it doesn't, we will either take over or close it, depending on the requirement on our time and our current priorities.

### Branching

If you’re working on a long-living branch, keep it updated with upstream changes by rebasing it on the target branch on a regular basis. This requires a force-push, so you should coordinate with anyone working on the same branch team when doing that.

### Commit Messages

Although we don’t enforce a strict format for commit messages, we prefer that you follow the guidelines below, which are common among open source projects. Following these guidelines helps with the review process, searching commit logs and documentation of implementation details. At a high level, the contents of the commit message should convey the rationale of the change, without delving into much detail. For example, `setter names were not set right` leaves the reviewer wondering about which bits and why they weren’t “right”. In contrast, `[RLMProperty] Correctly capitalize setterName` conveys almost all there is to the change.

Below are some guidelines about the format of the commit message itself:

* Separate the commit message into a single-line title and a separate body that describes the change.
* Make the title concise to be easily read within a commit log.
* Make the body concise, while including the complete reasoning. Unless required to understand the change, additional code examples or other details should be left to the pull request.
* If the commit fixes a bug, include the number of the issue in the message.
* Use the first person present tense - for example "Fix …" instead of "Fixes …" or "Fixed …".
* For text formatting and spelling, follow the same rules as documentation and in-code comments — for example, the use of capitalization and periods.
* If the commit is a bug fix on top of another recently committed change, or a revert or reapply of a patch, include the Git revision number of the prior related commit, e.g. `Revert abcd3fg because it caused #1234`.

### CLA

Realm welcomes all contributions! The only requirement we have is that, like many other projects, we need to have a [Contributor License Agreement](https://en.wikipedia.org/wiki/Contributor_License_Agreement) (CLA) in place before we can accept any external code. Our own CLA is a modified version of the Apache Software Foundation’s CLA.

[Please submit your CLA electronically using our Google form](https://docs.google.com/forms/d/e/1FAIpQLSeQ9ROFaTu9pyrmPhXc-dEnLD84DbLuT_-tPNZDOL9J10tOKQ/viewform) so we can accept your submissions. The GitHub username you file there will need to match that of your Pull Requests. If you have any questions or cannot file the CLA electronically, you can email <help@realm.io>.

## Building and Debugging the Realm Flipper Plugin Locally
This guide assumes that development is happening on a Mac. 
### 1. Building `realm-flipper-plugin-device`
1. Navigate to the device plugin directory: `cd realm-flipper-plugin-device`.
2. Install dependencies with `npm install`.
3. Build with `npm run build` or `npm run build -- --watch` for live build updates.

### 2. Building and using `flipper-plugin-realm`
1. Navigate to the device plugin directory: `cd flipper-plugin-realm`.
2. Install dependencies with `npm install`
3. Build with `npm run build` or `npm run build -- --watch` for live build updates.
4. **Add the path to your `flipper-plugin-realm` directory to `"pluginPaths"` of your `~/.flipper/config.json`.  See [Flipper Docs](https://fbflipper.com/docs/extending/loading-custom-plugins/) for more information**.

### 3. Testing the plugin with the Realm Flipper Tester
The plugin directory contains `testApp` which is a sample React Native application you can use to test the local device plugin. If you would like to embed the local device plugin version to a different app, refer to the `metro.config.json` and `package.json` of `testApp` as a reference for how that could be done.
1. Navigate to the test app directory `cd testApp`.
2. Install dependencies with `npm install`.
3. Install Pods with `cd ios && pod install`
4. Run the application by going back to `testApp` root with `cd ..` and `npm run ios`.

That's it! `testApp` will use the current build of `realm-flipper-plugin-device`.

