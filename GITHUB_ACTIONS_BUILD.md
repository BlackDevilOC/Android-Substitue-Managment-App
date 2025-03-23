# Building Android APK with GitHub Actions

This guide explains how to use GitHub Actions to automatically build an Android APK for your project without needing local access to Android Studio.

## Setup Instructions

### 1. Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository. If you haven't done this yet:

```bash
# Initialize git if needed
git init

# Add your files
git add .

# Commit your changes
git commit -m "Initial commit"

# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/yourrepository.git

# Push to GitHub
git push -u origin main
```

### 2. GitHub Actions Workflow

The workflow file (`.github/workflows/android-build.yml`) has been added to your project. This file defines the automated build process that will run on GitHub's servers.

Key steps in the workflow:
- Set up Java and Node.js environments
- Install project dependencies
- Install the Cordova SMS plugin
- Build the web assets
- Add and configure the Android platform
- Copy data files to Android assets
- Build the debug APK
- Upload the APK as a workflow artifact

### 3. Triggering the Build

The build will automatically trigger when you:
- Push code to the `main` branch
- Create a pull request to the `main` branch
- Manually trigger the workflow from the GitHub Actions tab

### 4. Accessing the Built APK

After the workflow completes successfully:

1. Go to your GitHub repository in a web browser
2. Click on the "Actions" tab
3. Click on the completed workflow run
4. Scroll down to the "Artifacts" section
5. Click on "app-debug" to download the APK

## Customization Options

### Changing the Branch

If you want to build from a different branch, edit the `on.push.branches` and `on.pull_request.branches` sections in the workflow file:

```yaml
on:
  push:
    branches: [ your-branch-name ]
  pull_request:
    branches: [ your-branch-name ]
```

### Building a Release APK

To build a signed release APK, you'll need to:

1. Generate a keystore file
2. Add the keystore and passwords as GitHub Secrets:
   - Go to your repository settings
   - Select "Secrets and variables" > "Actions"
   - Add the following secrets:
     - `KEYSTORE_BASE64`: Base64-encoded keystore file
     - `KEYSTORE_PASSWORD`: Your keystore password
     - `KEY_ALIAS`: Your key alias
     - `KEY_PASSWORD`: Your key password

3. Update the workflow to use these secrets for signing:

```yaml
# Add these steps before the Build Debug APK step
- name: Decode Keystore
  run: |
    echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > android/app/keystore.jks

- name: Build Release APK
  run: |
    cd android
    ./gradlew assembleRelease \
      -Pandroid.injected.signing.store.file=keystore.jks \
      -Pandroid.injected.signing.store.password=${{ secrets.KEYSTORE_PASSWORD }} \
      -Pandroid.injected.signing.key.alias=${{ secrets.KEY_ALIAS }} \
      -Pandroid.injected.signing.key.password=${{ secrets.KEY_PASSWORD }}
```

## Troubleshooting

### Build Failures

If the build fails, check the workflow logs:
1. Go to the "Actions" tab
2. Click on the failed workflow run
3. Expand the step that failed to see detailed error messages

Common issues:
- Missing dependencies
- Android configuration problems
- File permission issues
- Memory or storage limitations

### Missing Android Files

If you encounter errors about missing Android files or directories, make sure the Android platform is properly added to your repository. The workflow attempts to add it automatically, but you may need to adjust your capacitor.config.ts and other configuration files.