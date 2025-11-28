#!/bin/bash
# Updates cache-busting version parameters in HTML files to current git commit hash

COMMIT_HASH=$(git rev-parse --short HEAD)

# Update all HTML files with version parameters
for file in *.html; do
    if [ -f "$file" ]; then
        # Update any .js?v= parameters to use the new commit hash
        sed -i "s/\.js?v=[^\"']*'/\.js?v=$COMMIT_HASH'/g" "$file"
        sed -i "s/\.js?v=[^\"]*\"/\.js?v=$COMMIT_HASH\"/g" "$file"
    fi
done

echo "✓ Updated cache-busting version to: $COMMIT_HASH"
