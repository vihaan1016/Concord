import os, glob

path = "/home/vihaan-jain/zama/lib/forge-fhevm/src/**/*.sol"
files = glob.glob(path, recursive=True)

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    # Un-patch first
    content = content.replace("/* reinitializer(REINITIALIZER_VERSION) */", "reinitializer(REINITIALIZER_VERSION)")
    content = content.replace("/* _disableInitializers(); */", "_disableInitializers();")
    content = content.replace("if (false) {", "if (_getInitializedVersion() != 1) {")
    content = content.replace("/* /* _disableInitializers(); */ */", "_disableInitializers();")
    content = content.replace("/* /* reinitializer(REINITIALIZER_VERSION) */ */", "reinitializer(REINITIALIZER_VERSION)")

    # Re-patch safely
    new_content = content.replace("reinitializer(REINITIALIZER_VERSION)", "/* reinitializer(REINITIALIZER_VERSION) */")
    new_content = new_content.replace("_disableInitializers();", "/* _disableInitializers(); */")
    new_content = new_content.replace("if (_getInitializedVersion() != 1) {", "if (false) {")
    
    if new_content != content:
        with open(f, 'w') as file:
            file.write(new_content)
